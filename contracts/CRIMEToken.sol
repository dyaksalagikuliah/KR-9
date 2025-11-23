// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CRIMEToken
 * @notice Native token for Proof of Crime platform
 * @dev ERC20 token with staking and governance features
 */
contract CRIMEToken is ERC20, ERC20Burnable, Ownable, ERC20Pausable {

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimAt;
        uint256 rewardDebt;
    }

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant STAKING_APY = 12; // 12% APY
    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public constant MIN_STAKE_AMOUNT = 1000 * 10**18; // 1000 CRIME minimum

    // Staking state
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public rewardPool;

    // Subscription requirement
    uint256 public subscriptionRequirement = 2000 * 10**6; // 2K USDT worth in CRIME

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardPoolFunded(uint256 amount);

    constructor() ERC20("Proof of Crime Token", "CRIME") Ownable(msg.sender) {
        // Mint initial supply to owner
        _mint(msg.sender, MAX_SUPPLY);
    }

    /**
     * @notice Stake CRIME tokens to earn yield
     * @param _amount Amount to stake
     */
    function stake(uint256 _amount) external whenNotPaused {
        require(_amount >= MIN_STAKE_AMOUNT, "Below minimum stake");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");

        StakeInfo storage stakeInfo = stakes[msg.sender];

        // Claim pending rewards if any
        if (stakeInfo.amount > 0) {
            _claimRewards(msg.sender);
        }

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), _amount);

        // Update stake info
        stakeInfo.amount += _amount;
        stakeInfo.stakedAt = block.timestamp;
        stakeInfo.lastClaimAt = block.timestamp;

        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Unstake CRIME tokens
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _amount) external {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount >= _amount, "Insufficient staked");

        // Claim pending rewards
        _claimRewards(msg.sender);

        // Update stake info
        stakeInfo.amount -= _amount;
        totalStaked -= _amount;

        // Transfer tokens back to user
        _transfer(address(this), msg.sender, _amount);

        emit Unstaked(msg.sender, _amount);
    }

    /**
     * @notice Claim staking rewards
     */
    function claimRewards() external {
        _claimRewards(msg.sender);
    }

    /**
     * @notice Internal function to claim rewards
     * @param _user User address
     */
    function _claimRewards(address _user) internal {
        StakeInfo storage stakeInfo = stakes[_user];

        if (stakeInfo.amount == 0) return;

        uint256 reward = calculateReward(_user);

        if (reward > 0 && reward <= rewardPool) {
            stakeInfo.lastClaimAt = block.timestamp;
            stakeInfo.rewardDebt += reward;
            rewardPool -= reward;

            _transfer(address(this), _user, reward);
            emit RewardClaimed(_user, reward);
        }
    }

    /**
     * @notice Calculate pending rewards for a user
     * @param _user User address
     */
    function calculateReward(address _user) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[_user];

        if (stakeInfo.amount == 0) return 0;

        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimAt;
        uint256 reward = (stakeInfo.amount * STAKING_APY * timeStaked) / (100 * YEAR_IN_SECONDS);

        return reward;
    }

    /**
     * @notice Check if user has subscription requirement met
     * @param _user User address
     * @param _usdtValue USDT value equivalent in wallet
     */
    function hasSubscription(address _user, uint256 _usdtValue)
        external
        view
        returns (bool)
    {
        // Check if user has staked CRIME or has equivalent USDT
        uint256 stakedAmount = stakes[_user].amount;
        return stakedAmount >= MIN_STAKE_AMOUNT || _usdtValue >= subscriptionRequirement;
    }

    /**
     * @notice Get stake information for a user
     * @param _user User address
     */
    function getStakeInfo(address _user)
        external
        view
        returns (
            uint256 amount,
            uint256 stakedAt,
            uint256 pendingReward,
            uint256 totalEarned
        )
    {
        StakeInfo memory stakeInfo = stakes[_user];
        return (
            stakeInfo.amount,
            stakeInfo.stakedAt,
            calculateReward(_user),
            stakeInfo.rewardDebt
        );
    }

    /**
     * @notice Fund the reward pool (owner only)
     * @param _amount Amount to add to reward pool
     */
    function fundRewardPool(uint256 _amount) external onlyOwner {
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        _transfer(msg.sender, address(this), _amount);
        rewardPool += _amount;
        emit RewardPoolFunded(_amount);
    }

    /**
     * @notice Set subscription requirement (owner only)
     * @param _requirement New subscription requirement in USDT (6 decimals)
     */
    function setSubscriptionRequirement(uint256 _requirement) external onlyOwner {
        subscriptionRequirement = _requirement;
    }

    /**
     * @notice Pause token transfers (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause token transfers (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
