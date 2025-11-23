// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BountyManager
 * @notice Main contract for managing smart contract audit bounties
 * @dev Handles bounty creation, submission, validation, and reward distribution
 */
contract BountyManager is Ownable, Pausable, ReentrancyGuard {

    // Enums
    enum BountyStatus { Active, Dinilai, Valid, Invalid, Completed, Cancelled }
    enum VulnerabilitySeverity { None, Low, Medium, High }

    // Structs
    struct Bounty {
        uint256 id;
        address company;
        string targetContract;
        uint256 totalReward;
        uint256 remainingReward;
        uint256 lockAmount; // 100k USDT lock requirement
        BountyStatus status;
        uint256 createdAt;
        uint256 deadline;
        bool isActive;
        address paymentToken; // USDT or other ERC20
    }

    struct Submission {
        uint256 id;
        uint256 bountyId;
        address hunter;
        string vulnerabilityDetails;
        string proofOfConcept;
        VulnerabilitySeverity severity;
        BountyStatus status;
        uint256 rewardAmount;
        uint256 submittedAt;
        bool isPaid;
    }

    struct Hunter {
        address hunterAddress;
        uint256 totalEarned;
        uint256 successfulSubmissions;
        uint256 reputation;
        bool isActive;
    }

    // State variables
    uint256 public nextBountyId;
    uint256 public nextSubmissionId;
    uint256 public constant COMPANY_LOCK_AMOUNT = 100000 * 10**6; // 100k USDT (6 decimals)
    uint256 public platformFeePercentage = 5; // 5% platform fee
    address public vaultManager;
    address public validatorContract;

    // Reward amounts based on severity
    mapping(VulnerabilitySeverity => uint256) public severityRewards;

    // Storage
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Submission) public submissions;
    mapping(address => Hunter) public hunters;
    mapping(address => uint256[]) public companyBounties;
    mapping(address => uint256[]) public hunterSubmissions;
    mapping(uint256 => uint256[]) public bountySubmissions;

    // Events
    event BountyCreated(uint256 indexed bountyId, address indexed company, uint256 totalReward);
    event BountyLocked(uint256 indexed bountyId, uint256 lockAmount);
    event SubmissionCreated(uint256 indexed submissionId, uint256 indexed bountyId, address indexed hunter);
    event SubmissionValidated(uint256 indexed submissionId, VulnerabilitySeverity severity, bool isValid);
    event RewardPaid(uint256 indexed submissionId, address indexed hunter, uint256 amount);
    event BountyCompleted(uint256 indexed bountyId);
    event BountyCancelled(uint256 indexed bountyId);
    event HunterRegistered(address indexed hunter);

    // Modifiers
    modifier onlyValidator() {
        require(msg.sender == validatorContract, "Only validator can call");
        _;
    }

    modifier bountyExists(uint256 _bountyId) {
        require(_bountyId < nextBountyId, "Bounty does not exist");
        _;
    }

    modifier submissionExists(uint256 _submissionId) {
        require(_submissionId < nextSubmissionId, "Submission does not exist");
        _;
    }

    constructor(address _vaultManager) Ownable(msg.sender) {
        vaultManager = _vaultManager;

        // Set default severity rewards (in USDT with 6 decimals)
        severityRewards[VulnerabilitySeverity.Low] = 10000 * 10**6; // $10k
        severityRewards[VulnerabilitySeverity.Medium] = 25000 * 10**6; // $25k
        severityRewards[VulnerabilitySeverity.High] = 50000 * 10**6; // $50k
    }

    /**
     * @notice Create a new bounty (Company locks 100k USDT)
     * @param _targetContract The smart contract to be audited
     * @param _totalReward Total reward pool for the bounty
     * @param _deadline Bounty deadline timestamp
     * @param _paymentToken ERC20 token address for payment (USDT)
     */
    function createBounty(
        string memory _targetContract,
        uint256 _totalReward,
        uint256 _deadline,
        address _paymentToken
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_totalReward > 0, "Reward must be > 0");
        require(_paymentToken != address(0), "Invalid token");

        IERC20 token = IERC20(_paymentToken);

        // Lock 100k USDT from company
        require(
            token.transferFrom(msg.sender, address(this), COMPANY_LOCK_AMOUNT),
            "Failed to lock funds"
        );

        // Transfer total reward to vault
        require(
            token.transferFrom(msg.sender, vaultManager, _totalReward),
            "Failed to transfer reward"
        );

        uint256 bountyId = nextBountyId++;

        bounties[bountyId] = Bounty({
            id: bountyId,
            company: msg.sender,
            targetContract: _targetContract,
            totalReward: _totalReward,
            remainingReward: _totalReward,
            lockAmount: COMPANY_LOCK_AMOUNT,
            status: BountyStatus.Active,
            createdAt: block.timestamp,
            deadline: _deadline,
            isActive: true,
            paymentToken: _paymentToken
        });

        companyBounties[msg.sender].push(bountyId);

        emit BountyCreated(bountyId, msg.sender, _totalReward);
        emit BountyLocked(bountyId, COMPANY_LOCK_AMOUNT);

        return bountyId;
    }

    /**
     * @notice Register as a bounty hunter
     */
    function registerHunter() external {
        require(!hunters[msg.sender].isActive, "Already registered");

        hunters[msg.sender] = Hunter({
            hunterAddress: msg.sender,
            totalEarned: 0,
            successfulSubmissions: 0,
            reputation: 0,
            isActive: true
        });

        emit HunterRegistered(msg.sender);
    }

    /**
     * @notice Submit a vulnerability finding
     * @param _bountyId The bounty ID
     * @param _vulnerabilityDetails Description of the vulnerability
     * @param _proofOfConcept Proof of concept code/explanation
     */
    function submitFinding(
        uint256 _bountyId,
        string memory _vulnerabilityDetails,
        string memory _proofOfConcept
    ) external nonReentrant whenNotPaused bountyExists(_bountyId) returns (uint256) {
        require(hunters[msg.sender].isActive, "Not registered as hunter");

        Bounty storage bounty = bounties[_bountyId];
        require(bounty.isActive, "Bounty not active");
        require(block.timestamp < bounty.deadline, "Bounty expired");

        uint256 submissionId = nextSubmissionId++;

        submissions[submissionId] = Submission({
            id: submissionId,
            bountyId: _bountyId,
            hunter: msg.sender,
            vulnerabilityDetails: _vulnerabilityDetails,
            proofOfConcept: _proofOfConcept,
            severity: VulnerabilitySeverity.None,
            status: BountyStatus.Dinilai,
            rewardAmount: 0,
            submittedAt: block.timestamp,
            isPaid: false
        });

        hunterSubmissions[msg.sender].push(submissionId);
        bountySubmissions[_bountyId].push(submissionId);

        emit SubmissionCreated(submissionId, _bountyId, msg.sender);

        return submissionId;
    }

    /**
     * @notice Validate a submission (called by validator contract)
     * @param _submissionId The submission ID
     * @param _severity The vulnerability severity
     * @param _isValid Whether the submission is valid
     */
    function validateSubmission(
        uint256 _submissionId,
        VulnerabilitySeverity _severity,
        bool _isValid
    ) external onlyValidator submissionExists(_submissionId) {
        Submission storage submission = submissions[_submissionId];
        require(submission.status == BountyStatus.Dinilai, "Already validated");

        submission.severity = _severity;
        submission.status = _isValid ? BountyStatus.Valid : BountyStatus.Invalid;

        if (_isValid && _severity != VulnerabilitySeverity.None) {
            submission.rewardAmount = severityRewards[_severity];
        }

        emit SubmissionValidated(_submissionId, _severity, _isValid);
    }

    /**
     * @notice Pay reward to hunter for valid submission
     * @param _submissionId The submission ID
     */
    function payReward(uint256 _submissionId)
        external
        nonReentrant
        submissionExists(_submissionId)
    {
        Submission storage submission = submissions[_submissionId];
        require(submission.status == BountyStatus.Valid, "Not valid");
        require(!submission.isPaid, "Already paid");

        Bounty storage bounty = bounties[submission.bountyId];
        require(bounty.remainingReward >= submission.rewardAmount, "Insufficient funds");

        // Calculate platform fee
        uint256 platformFee = (submission.rewardAmount * platformFeePercentage) / 100;
        uint256 hunterReward = submission.rewardAmount - platformFee;

        // Update state
        submission.isPaid = true;
        bounty.remainingReward -= submission.rewardAmount;

        Hunter storage hunter = hunters[submission.hunter];
        hunter.totalEarned += hunterReward;
        hunter.successfulSubmissions++;
        hunter.reputation += uint256(_severity2Points(submission.severity));

        // Transfer from vault to hunter
        require(
            IVaultManager(vaultManager).payoutReward(
                bounty.paymentToken,
                submission.hunter,
                hunterReward,
                owner(),
                platformFee
            ),
            "Payout failed"
        );

        emit RewardPaid(_submissionId, submission.hunter, hunterReward);
    }

    /**
     * @notice Complete a bounty and return locked funds to company
     * @param _bountyId The bounty ID
     */
    function completeBounty(uint256 _bountyId)
        external
        nonReentrant
        bountyExists(_bountyId)
    {
        Bounty storage bounty = bounties[_bountyId];
        require(msg.sender == bounty.company || msg.sender == owner(), "Not authorized");
        require(bounty.isActive, "Not active");

        bounty.isActive = false;
        bounty.status = BountyStatus.Completed;

        // Return locked funds to company
        IERC20(bounty.paymentToken).transfer(bounty.company, bounty.lockAmount);

        // Return remaining rewards if any
        if (bounty.remainingReward > 0) {
            IVaultManager(vaultManager).returnFunds(
                bounty.paymentToken,
                bounty.company,
                bounty.remainingReward
            );
        }

        emit BountyCompleted(_bountyId);
    }

    /**
     * @notice Cancel a bounty (only if no valid submissions)
     * @param _bountyId The bounty ID
     */
    function cancelBounty(uint256 _bountyId)
        external
        nonReentrant
        bountyExists(_bountyId)
    {
        Bounty storage bounty = bounties[_bountyId];
        require(msg.sender == bounty.company, "Not company");
        require(bounty.isActive, "Not active");

        // Check no valid submissions
        uint256[] memory subs = bountySubmissions[_bountyId];
        for (uint256 i = 0; i < subs.length; i++) {
            require(
                submissions[subs[i]].status != BountyStatus.Valid,
                "Has valid submissions"
            );
        }

        bounty.isActive = false;
        bounty.status = BountyStatus.Cancelled;

        // Return locked funds and rewards
        IERC20(bounty.paymentToken).transfer(bounty.company, bounty.lockAmount);
        IVaultManager(vaultManager).returnFunds(
            bounty.paymentToken,
            bounty.company,
            bounty.remainingReward
        );

        emit BountyCancelled(_bountyId);
    }

    // Helper functions
    function _severity2Points(VulnerabilitySeverity _severity)
        internal
        pure
        returns (uint256)
    {
        if (_severity == VulnerabilitySeverity.Low) return 10;
        if (_severity == VulnerabilitySeverity.Medium) return 25;
        if (_severity == VulnerabilitySeverity.High) return 50;
        return 0;
    }

    // Getters
    function getBountySubmissions(uint256 _bountyId)
        external
        view
        returns (uint256[] memory)
    {
        return bountySubmissions[_bountyId];
    }

    function getHunterSubmissions(address _hunter)
        external
        view
        returns (uint256[] memory)
    {
        return hunterSubmissions[_hunter];
    }

    function getCompanyBounties(address _company)
        external
        view
        returns (uint256[] memory)
    {
        return companyBounties[_company];
    }

    // Admin functions
    function setValidatorContract(address _validator) external onlyOwner {
        validatorContract = _validator;
    }

    function setVaultManager(address _vaultManager) external onlyOwner {
        vaultManager = _vaultManager;
    }

    function setSeverityReward(VulnerabilitySeverity _severity, uint256 _amount)
        external
        onlyOwner
    {
        severityRewards[_severity] = _amount;
    }

    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high");
        platformFeePercentage = _feePercentage;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

interface IVaultManager {
    function payoutReward(
        address token,
        address hunter,
        uint256 hunterAmount,
        address platform,
        uint256 platformFee
    ) external returns (bool);

    function returnFunds(
        address token,
        address recipient,
        uint256 amount
    ) external returns (bool);
}
