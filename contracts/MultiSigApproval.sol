// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MultiSigApproval
 * @notice Multi-signature approval system for wallet approvals (wallet 1, wallet 2, wallet 3)
 * @dev Implements the approval flow shown in the diagram for opening vault
 */
contract MultiSigApproval is Ownable {

    struct ApprovalRequest {
        uint256 id;
        address requester;
        bytes32 requestType; // "OPEN_VAULT", "VALIDATE_SUBMISSION", etc.
        bytes data;
        uint256 createdAt;
        uint256 approvalCount;
        bool isExecuted;
        bool isCancelled;
        mapping(address => bool) approvals;
    }

    struct Wallet {
        address walletAddress;
        string walletName;
        bool isActive;
        uint256 totalApprovals;
    }

    // State variables
    address public wallet1; // Pihak perusahaan
    address public wallet2; // Dapps
    address public wallet3; // Professional

    uint256 public requiredApprovals = 3; // All wallets must approve
    uint256 public nextRequestId;

    mapping(uint256 => ApprovalRequest) public approvalRequests;
    mapping(address => Wallet) public wallets;
    mapping(bytes32 => address) public targetContracts; // Maps request types to contract addresses

    // Events
    event WalletRegistered(address indexed wallet, string walletName);
    event ApprovalRequested(uint256 indexed requestId, bytes32 requestType, address indexed requester);
    event ApprovalGranted(uint256 indexed requestId, address indexed approver);
    event ApprovalExecuted(uint256 indexed requestId);
    event ApprovalCancelled(uint256 indexed requestId);
    event TargetContractSet(bytes32 requestType, address targetContract);

    modifier onlyWallet() {
        require(
            msg.sender == wallet1 || msg.sender == wallet2 || msg.sender == wallet3,
            "Not authorized wallet"
        );
        require(wallets[msg.sender].isActive, "Wallet not active");
        _;
    }

    constructor(
        address _wallet1,
        address _wallet2,
        address _wallet3
    ) Ownable(msg.sender) {
        require(_wallet1 != address(0) && _wallet2 != address(0) && _wallet3 != address(0), "Invalid wallet");

        wallet1 = _wallet1;
        wallet2 = _wallet2;
        wallet3 = _wallet3;

        // Register wallets
        wallets[_wallet1] = Wallet({
            walletAddress: _wallet1,
            walletName: "Company Wallet",
            isActive: true,
            totalApprovals: 0
        });

        wallets[_wallet2] = Wallet({
            walletAddress: _wallet2,
            walletName: "DApp Wallet",
            isActive: true,
            totalApprovals: 0
        });

        wallets[_wallet3] = Wallet({
            walletAddress: _wallet3,
            walletName: "Professional Wallet",
            isActive: true,
            totalApprovals: 0
        });

        emit WalletRegistered(_wallet1, "Company Wallet");
        emit WalletRegistered(_wallet2, "DApp Wallet");
        emit WalletRegistered(_wallet3, "Professional Wallet");
    }

    /**
     * @notice Create approval request for opening vault or other actions
     * @param _requestType Type of request (OPEN_VAULT, etc.)
     * @param _data Encoded data for the request
     */
    function requestApproval(bytes32 _requestType, bytes memory _data)
        external
        returns (uint256)
    {
        uint256 requestId = nextRequestId++;

        ApprovalRequest storage request = approvalRequests[requestId];
        request.id = requestId;
        request.requester = msg.sender;
        request.requestType = _requestType;
        request.data = _data;
        request.createdAt = block.timestamp;
        request.approvalCount = 0;
        request.isExecuted = false;
        request.isCancelled = false;

        emit ApprovalRequested(requestId, _requestType, msg.sender);
        return requestId;
    }

    /**
     * @notice Approve a request (wallet1, wallet2, or wallet3)
     * @param _requestId The request ID
     */
    function approve(uint256 _requestId) external onlyWallet {
        ApprovalRequest storage request = approvalRequests[_requestId];
        require(!request.isExecuted, "Already executed");
        require(!request.isCancelled, "Request cancelled");
        require(!request.approvals[msg.sender], "Already approved");

        request.approvals[msg.sender] = true;
        request.approvalCount++;

        wallets[msg.sender].totalApprovals++;

        emit ApprovalGranted(_requestId, msg.sender);

        // Auto-execute if all approvals received
        if (request.approvalCount >= requiredApprovals) {
            _executeRequest(_requestId);
        }
    }

    /**
     * @notice Execute approved request
     * @param _requestId The request ID
     */
    function _executeRequest(uint256 _requestId) internal {
        ApprovalRequest storage request = approvalRequests[_requestId];
        require(request.approvalCount >= requiredApprovals, "Not enough approvals");
        require(!request.isExecuted, "Already executed");

        request.isExecuted = true;

        // Call target contract based on request type
        address targetContract = targetContracts[request.requestType];
        if (targetContract != address(0)) {
            (bool success, ) = targetContract.call(request.data);
            require(success, "Execution failed");
        }

        emit ApprovalExecuted(_requestId);
    }

    /**
     * @notice Manually execute approved request (if auto-execute failed)
     * @param _requestId The request ID
     */
    function executeRequest(uint256 _requestId) external onlyWallet {
        _executeRequest(_requestId);
    }

    /**
     * @notice Cancel a request (only requester or owner)
     * @param _requestId The request ID
     */
    function cancelRequest(uint256 _requestId) external {
        ApprovalRequest storage request = approvalRequests[_requestId];
        require(
            msg.sender == request.requester || msg.sender == owner(),
            "Not authorized"
        );
        require(!request.isExecuted, "Already executed");
        require(!request.isCancelled, "Already cancelled");

        request.isCancelled = true;
        emit ApprovalCancelled(_requestId);
    }

    /**
     * @notice Check if request has approval from specific wallet
     * @param _requestId The request ID
     * @param _wallet Wallet address
     */
    function hasApproved(uint256 _requestId, address _wallet)
        external
        view
        returns (bool)
    {
        return approvalRequests[_requestId].approvals[_wallet];
    }

    /**
     * @notice Check if request has all required approvals
     * @param _requestId The request ID
     */
    function isFullyApproved(uint256 _requestId) external view returns (bool) {
        ApprovalRequest storage request = approvalRequests[_requestId];
        return request.approvalCount >= requiredApprovals;
    }

    /**
     * @notice Get approval status for a request
     * @param _requestId The request ID
     */
    function getApprovalStatus(uint256 _requestId)
        external
        view
        returns (
            address requester,
            bytes32 requestType,
            uint256 approvalCount,
            bool isExecuted,
            bool isCancelled,
            bool wallet1Approved,
            bool wallet2Approved,
            bool wallet3Approved
        )
    {
        ApprovalRequest storage request = approvalRequests[_requestId];
        return (
            request.requester,
            request.requestType,
            request.approvalCount,
            request.isExecuted,
            request.isCancelled,
            request.approvals[wallet1],
            request.approvals[wallet2],
            request.approvals[wallet3]
        );
    }

    /**
     * @notice Get wallet information
     * @param _wallet Wallet address
     */
    function getWalletInfo(address _wallet)
        external
        view
        returns (
            string memory walletName,
            bool isActive,
            uint256 totalApprovals
        )
    {
        Wallet memory w = wallets[_wallet];
        return (w.walletName, w.isActive, w.totalApprovals);
    }

    // Admin functions
    function setTargetContract(bytes32 _requestType, address _targetContract)
        external
        onlyOwner
    {
        targetContracts[_requestType] = _targetContract;
        emit TargetContractSet(_requestType, _targetContract);
    }

    function updateWallet(address _oldWallet, address _newWallet, string memory _walletName)
        external
        onlyOwner
    {
        require(_newWallet != address(0), "Invalid address");

        // Deactivate old wallet
        wallets[_oldWallet].isActive = false;

        // Create new wallet
        wallets[_newWallet] = Wallet({
            walletAddress: _newWallet,
            walletName: _walletName,
            isActive: true,
            totalApprovals: 0
        });

        // Update wallet addresses
        if (_oldWallet == wallet1) {
            wallet1 = _newWallet;
        } else if (_oldWallet == wallet2) {
            wallet2 = _newWallet;
        } else if (_oldWallet == wallet3) {
            wallet3 = _newWallet;
        }

        emit WalletRegistered(_newWallet, _walletName);
    }

    function setRequiredApprovals(uint256 _required) external onlyOwner {
        require(_required >= 1 && _required <= 3, "Invalid range");
        requiredApprovals = _required;
    }

    function toggleWalletStatus(address _wallet) external onlyOwner {
        wallets[_wallet].isActive = !wallets[_wallet].isActive;
    }
}
