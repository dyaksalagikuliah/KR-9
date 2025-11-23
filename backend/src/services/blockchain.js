const { ethers } = require('ethers');
const { getContractAddress } = require('../contracts/addresses');
const path = require('path');
const fs = require('fs');

/**
 * Load ABI from artifacts
 */
function loadABI(contractName) {
  try {
    const artifactPath = path.join(
      __dirname,
      '../../../artifacts/contracts',
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = require(artifactPath);
      return artifact.abi;
    }

    // Fallback: try from backend abis folder
    const abiPath = path.join(__dirname, '../contracts/abis', `${contractName}.json`);
    if (fs.existsSync(abiPath)) {
      return require(abiPath);
    }

    throw new Error(`ABI not found for ${contractName}`);
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error.message);
    throw error;
  }
}

/**
 * Blockchain Service
 * Handles all interactions with smart contracts
 */
class BlockchainService {
  constructor(network = null) {
    this.network = network || process.env.NETWORK || 'sepolia';
    this.provider = null;
    this.contracts = {};
    this.initialized = false;
  }

  /**
   * Initialize blockchain service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log(`🔗 Initializing Blockchain Service for ${this.network}...`);

      // Setup provider
      const rpcUrl = this.getRpcUrl();
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`✅ Connected to ${this.network} at block ${blockNumber}`);

      // Initialize contracts
      await this.initializeContracts();

      this.initialized = true;
      console.log('✅ Blockchain Service initialized\n');
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Service:', error);
      throw error;
    }
  }

  /**
   * Get RPC URL for network
   */
  getRpcUrl() {
    const rpcUrls = {
      mainnet: process.env.ETHEREUM_RPC_URL,
      sepolia: process.env.SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL,
      polygon: process.env.POLYGON_RPC_URL,
      bsc: process.env.BSC_RPC_URL,
      localhost: 'http://127.0.0.1:8545',
    };

    const url = rpcUrls[this.network];
    if (!url) {
      throw new Error(`RPC URL not configured for ${this.network}`);
    }

    return url;
  }

  /**
   * Initialize all contract instances
   */
  async initializeContracts() {
    const contractNames = [
      'BountyManager',
      'VaultManager',
      'VulnerabilityValidator',
      'MultiSigApproval',
      'CRIMEToken',
    ];

    for (const name of contractNames) {
      try {
        const address = getContractAddress(name, this.network);
        const abi = loadABI(name);

        this.contracts[name] = new ethers.Contract(address, abi, this.provider);
        console.log(`  ✓ ${name}: ${address}`);
      } catch (error) {
        console.warn(`  ⚠ ${name}: Not available (${error.message})`);
      }
    }
  }

  /**
   * Get contract instance
   */
  getContract(contractName) {
    if (!this.contracts[contractName]) {
      throw new Error(`Contract ${contractName} not initialized`);
    }
    return this.contracts[contractName];
  }

  // ============================================
  // BOUNTY MANAGER METHODS
  // ============================================

  /**
   * Get bounty data from blockchain
   */
  async getBounty(bountyId) {
    const bountyManager = this.getContract('BountyManager');
    const bounty = await bountyManager.bounties(bountyId);

    return {
      id: bountyId,
      company: bounty.company,
      targetContract: bounty.targetContract,
      totalReward: bounty.totalReward.toString(),
      remainingReward: bounty.remainingReward.toString(),
      lockAmount: bounty.lockAmount.toString(),
      status: bounty.status,
      createdAt: Number(bounty.createdAt),
      deadline: Number(bounty.deadline),
      isActive: bounty.isActive,
      paymentToken: bounty.paymentToken,
    };
  }

  /**
   * Get submission data from blockchain
   */
  async getSubmission(submissionId) {
    const bountyManager = this.getContract('BountyManager');
    const submission = await bountyManager.submissions(submissionId);

    return {
      id: submissionId,
      bountyId: Number(submission.bountyId),
      hunter: submission.hunter,
      vulnerabilityDetails: submission.vulnerabilityDetails,
      proofOfConcept: submission.proofOfConcept,
      severity: submission.severity,
      status: submission.status,
      rewardAmount: submission.rewardAmount.toString(),
      submittedAt: Number(submission.submittedAt),
      isPaid: submission.isPaid,
    };
  }

  /**
   * Get hunter information from blockchain
   */
  async getHunter(address) {
    const bountyManager = this.getContract('BountyManager');
    const hunter = await bountyManager.hunters(address);

    return {
      hunterAddress: hunter.hunterAddress,
      totalEarned: hunter.totalEarned.toString(),
      successfulSubmissions: Number(hunter.successfulSubmissions),
      reputation: Number(hunter.reputation),
      isActive: hunter.isActive,
    };
  }

  /**
   * Get bounty submissions from blockchain
   */
  async getBountySubmissions(bountyId) {
    const bountyManager = this.getContract('BountyManager');
    const submissionIds = await bountyManager.getBountySubmissions(bountyId);
    return submissionIds.map(id => Number(id));
  }

  /**
   * Get hunter submissions from blockchain
   */
  async getHunterSubmissions(hunterAddress) {
    const bountyManager = this.getContract('BountyManager');
    const submissionIds = await bountyManager.getHunterSubmissions(hunterAddress);
    return submissionIds.map(id => Number(id));
  }

  /**
   * Get next bounty ID
   */
  async getNextBountyId() {
    const bountyManager = this.getContract('BountyManager');
    return Number(await bountyManager.nextBountyId());
  }

  /**
   * Get next submission ID
   */
  async getNextSubmissionId() {
    const bountyManager = this.getContract('BountyManager');
    return Number(await bountyManager.nextSubmissionId());
  }

  // ============================================
  // VALIDATOR METHODS
  // ============================================

  /**
   * Get validation status
   */
  async getValidationStatus(submissionId) {
    const validator = this.getContract('VulnerabilityValidator');
    const status = await validator.getValidationStatus(submissionId);

    return {
      severity: status.severity,
      status: status.status,
      totalVotes: Number(status.totalVotes),
      approvals: Number(status.approvals),
      rejections: Number(status.rejections),
      isFinalized: status.isFinalized,
    };
  }

  /**
   * Get validation votes
   */
  async getValidationVotes(submissionId) {
    const validator = this.getContract('VulnerabilityValidator');
    const voters = await validator.getValidationVotes(submissionId);
    return voters;
  }

  /**
   * Get validator stats
   */
  async getValidatorStats(validatorAddress) {
    const validator = this.getContract('VulnerabilityValidator');
    const stats = await validator.getValidatorStats(validatorAddress);

    return {
      reputation: Number(stats.reputation),
      totalValidations: Number(stats.totalValidations),
    };
  }

  // ============================================
  // VAULT MANAGER METHODS
  // ============================================

  /**
   * Get vault balance
   */
  async getVaultBalance(tokenAddress) {
    const vault = this.getContract('VaultManager');
    const balance = await vault.getVaultBalance(tokenAddress);

    return {
      totalDeposited: balance.totalDeposited.toString(),
      totalWithdrawn: balance.totalWithdrawn.toString(),
      availableBalance: balance.availableBalance.toString(),
    };
  }

  // ============================================
  // CRIME TOKEN METHODS
  // ============================================

  /**
   * Get token balance
   */
  async getTokenBalance(address) {
    const token = this.getContract('CRIMEToken');
    const balance = await token.balanceOf(address);
    return balance.toString();
  }

  /**
   * Get staking info
   */
  async getStakeInfo(address) {
    const token = this.getContract('CRIMEToken');
    const info = await token.getStakeInfo(address);

    return {
      amount: info.amount.toString(),
      stakedAt: Number(info.stakedAt),
      pendingReward: info.pendingReward.toString(),
      totalEarned: info.totalEarned.toString(),
    };
  }

  /**
   * Check subscription status
   */
  async hasSubscription(address, usdtValue) {
    const token = this.getContract('CRIMEToken');
    return await token.hasSubscription(address, usdtValue);
  }

  /**
   * Get token total supply
   */
  async getTotalSupply() {
    const token = this.getContract('CRIMEToken');
    return (await token.totalSupply()).toString();
  }

  // ============================================
  // MULTI-SIG APPROVAL METHODS
  // ============================================

  /**
   * Get approval status
   */
  async getApprovalStatus(requestId) {
    const multiSig = this.getContract('MultiSigApproval');
    const status = await multiSig.getApprovalStatus(requestId);

    return {
      requester: status.requester,
      requestType: status.requestType,
      approvalCount: Number(status.approvalCount),
      isExecuted: status.isExecuted,
      isCancelled: status.isCancelled,
      wallet1Approved: status.wallet1Approved,
      wallet2Approved: status.wallet2Approved,
      wallet3Approved: status.wallet3Approved,
    };
  }

  /**
   * Get wallet info
   */
  async getWalletInfo(walletAddress) {
    const multiSig = this.getContract('MultiSigApproval');
    const info = await multiSig.getWalletInfo(walletAddress);

    return {
      walletName: info.walletName,
      isActive: info.isActive,
      totalApprovals: Number(info.totalApprovals),
    };
  }

  /**
   * Check if fully approved
   */
  async isFullyApproved(requestId) {
    const multiSig = this.getContract('MultiSigApproval');
    return await multiSig.isFullyApproved(requestId);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block timestamp
   */
  async getBlockTimestamp(blockNumber) {
    const block = await this.provider.getBlock(blockNumber);
    return block.timestamp;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction
   */
  async waitForTransaction(txHash, confirmations = 1) {
    return await this.provider.waitForTransaction(txHash, confirmations);
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    const feeData = await this.provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
    };
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(tx) {
    return await this.provider.estimateGas(tx);
  }

  /**
   * Format units (from wei to human readable)
   */
  formatUnits(value, decimals = 18) {
    return ethers.formatUnits(value, decimals);
  }

  /**
   * Parse units (from human readable to wei)
   */
  parseUnits(value, decimals = 18) {
    return ethers.parseUnits(value.toString(), decimals);
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

// Singleton instance
let blockchainService = null;

/**
 * Get blockchain service instance
 */
function getBlockchainService(network = null) {
  if (!blockchainService) {
    blockchainService = new BlockchainService(network);
  }
  return blockchainService;
}

/**
 * Initialize blockchain service
 */
async function initializeBlockchainService(network = null) {
  const service = getBlockchainService(network);
  await service.initialize();
  return service;
}

module.exports = {
  BlockchainService,
  getBlockchainService,
  initializeBlockchainService,
};
