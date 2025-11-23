// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VaultManager
 * @notice Manages bounty funds, reward distributions, and multi-signature approvals
 * @dev Acts as secure vault for all bounty-related funds
 */
contract VaultManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct VaultBalance {
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 availableBalance;
    }

    struct WithdrawalRequest {
        uint256 id;
        address token;
        address recipient;
        uint256 amount;
        uint256 requestedAt;
        uint256 approvalCount;
        bool isExecuted;
        bool isCancelled;
        mapping(address => bool) approvals;
    }

    // State variables
    address public bountyManager;
    address public multiSigApproval;
    uint256 public nextWithdrawalId;

    mapping(address => VaultBalance) public tokenBalances;
    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => bool) public authorizedManagers;

    // Events
    event FundsDeposited(address indexed token, address indexed from, uint256 amount);
    event RewardPaid(address indexed token, address indexed hunter, uint256 amount);
    event PlatformFeePaid(address indexed token, address indexed platform, uint256 amount);
    event FundsReturned(address indexed token, address indexed recipient, uint256 amount);
    event WithdrawalRequested(uint256 indexed withdrawalId, address indexed token, address recipient, uint256 amount);
    event WithdrawalExecuted(uint256 indexed withdrawalId);
    event WithdrawalCancelled(uint256 indexed withdrawalId);
    event ManagerAuthorized(address indexed manager);
    event ManagerRevoked(address indexed manager);

    modifier onlyAuthorized() {
        require(
            msg.sender == bountyManager || authorizedManagers[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    modifier onlyBountyManager() {
        require(msg.sender == bountyManager, "Only bounty manager");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedManagers[msg.sender] = true;
    }

    /**
     * @notice Deposit funds to vault
     * @param _token Token address
     * @param _amount Amount to deposit
     */
    function deposit(address _token, uint256 _amount)
        external
        nonReentrant
        returns (bool)
    {
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be > 0");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        VaultBalance storage balance = tokenBalances[_token];
        balance.totalDeposited += _amount;
        balance.availableBalance += _amount;

        emit FundsDeposited(_token, msg.sender, _amount);
        return true;
    }

    /**
     * @notice Pay reward to hunter (called by BountyManager)
     * @param _token Payment token address
     * @param _hunter Hunter address
     * @param _hunterAmount Amount for hunter
     * @param _platform Platform address
     * @param _platformFee Platform fee amount
     */
    function payoutReward(
        address _token,
        address _hunter,
        uint256 _hunterAmount,
        address _platform,
        uint256 _platformFee
    ) external onlyBountyManager nonReentrant returns (bool) {
        VaultBalance storage balance = tokenBalances[_token];
        uint256 totalAmount = _hunterAmount + _platformFee;

        require(balance.availableBalance >= totalAmount, "Insufficient balance");

        // Update balances
        balance.availableBalance -= totalAmount;
        balance.totalWithdrawn += totalAmount;

        // Transfer to hunter
        IERC20(_token).safeTransfer(_hunter, _hunterAmount);
        emit RewardPaid(_token, _hunter, _hunterAmount);

        // Transfer platform fee
        if (_platformFee > 0) {
            IERC20(_token).safeTransfer(_platform, _platformFee);
            emit PlatformFeePaid(_token, _platform, _platformFee);
        }

        return true;
    }

    /**
     * @notice Return funds to bounty creator
     * @param _token Token address
     * @param _recipient Recipient address
     * @param _amount Amount to return
     */
    function returnFunds(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyBountyManager nonReentrant returns (bool) {
        VaultBalance storage balance = tokenBalances[_token];
        require(balance.availableBalance >= _amount, "Insufficient balance");

        balance.availableBalance -= _amount;
        balance.totalWithdrawn += _amount;

        IERC20(_token).safeTransfer(_recipient, _amount);

        emit FundsReturned(_token, _recipient, _amount);
        return true;
    }

    /**
     * @notice Request withdrawal (requires multi-sig approval for large amounts)
     * @param _token Token address
     * @param _recipient Recipient address
     * @param _amount Amount to withdraw
     */
    function requestWithdrawal(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyAuthorized returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(tokenBalances[_token].availableBalance >= _amount, "Insufficient balance");

        uint256 withdrawalId = nextWithdrawalId++;

        WithdrawalRequest storage request = withdrawalRequests[withdrawalId];
        request.id = withdrawalId;
        request.token = _token;
        request.recipient = _recipient;
        request.amount = _amount;
        request.requestedAt = block.timestamp;
        request.approvalCount = 0;
        request.isExecuted = false;
        request.isCancelled = false;

        emit WithdrawalRequested(withdrawalId, _token, _recipient, _amount);
        return withdrawalId;
    }

    /**
     * @notice Emergency withdrawal (owner only, for stuck funds)
     * @param _token Token address
     * @param _recipient Recipient address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyOwner nonReentrant {
        IERC20(_token).safeTransfer(_recipient, _amount);
        emit FundsReturned(_token, _recipient, _amount);
    }

    // Getters
    function getVaultBalance(address _token)
        external
        view
        returns (
            uint256 totalDeposited,
            uint256 totalWithdrawn,
            uint256 availableBalance
        )
    {
        VaultBalance memory balance = tokenBalances[_token];
        return (balance.totalDeposited, balance.totalWithdrawn, balance.availableBalance);
    }

    function getWithdrawalRequest(uint256 _withdrawalId)
        external
        view
        returns (
            address token,
            address recipient,
            uint256 amount,
            uint256 requestedAt,
            uint256 approvalCount,
            bool isExecuted,
            bool isCancelled
        )
    {
        WithdrawalRequest storage request = withdrawalRequests[_withdrawalId];
        return (
            request.token,
            request.recipient,
            request.amount,
            request.requestedAt,
            request.approvalCount,
            request.isExecuted,
            request.isCancelled
        );
    }

    // Admin functions
    function setBountyManager(address _bountyManager) external onlyOwner {
        require(_bountyManager != address(0), "Invalid address");
        bountyManager = _bountyManager;
    }

    function setMultiSigApproval(address _multiSig) external onlyOwner {
        require(_multiSig != address(0), "Invalid address");
        multiSigApproval = _multiSig;
    }

    function authorizeManager(address _manager) external onlyOwner {
        require(_manager != address(0), "Invalid address");
        authorizedManagers[_manager] = true;
        emit ManagerAuthorized(_manager);
    }

    function revokeManager(address _manager) external onlyOwner {
        authorizedManagers[_manager] = false;
        emit ManagerRevoked(_manager);
    }
}
