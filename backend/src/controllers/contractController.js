const { getBlockchainService } = require('../services/blockchain');
const { query } = require('../config/database');
const { cache } = require('../config/redis');

/**
 * Get blockchain contract data
 */
exports.getContractData = async (req, res) => {
  try {
    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const data = {
      network: blockchain.network,
      blockNumber: await blockchain.getBlockNumber(),
      contracts: {
        BountyManager: blockchain.contracts.BountyManager?.target,
        VaultManager: blockchain.contracts.VaultManager?.target,
        VulnerabilityValidator: blockchain.contracts.VulnerabilityValidator?.target,
        MultiSigApproval: blockchain.contracts.MultiSigApproval?.target,
        CRIMEToken: blockchain.contracts.CRIMEToken?.target,
      },
      gasPrice: await blockchain.getGasPrice(),
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get contract data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract data',
    });
  }
};

/**
 * Get bounty from blockchain
 */
exports.getBountyOnChain = async (req, res) => {
  try {
    const { bountyId } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const bounty = await blockchain.getBounty(bountyId);

    res.json({
      success: true,
      data: { bounty },
    });
  } catch (error) {
    console.error('Get bounty on-chain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bounty from blockchain',
    });
  }
};

/**
 * Get submission from blockchain
 */
exports.getSubmissionOnChain = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const submission = await blockchain.getSubmission(submissionId);

    res.json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    console.error('Get submission on-chain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission from blockchain',
    });
  }
};

/**
 * Get hunter stats from blockchain
 */
exports.getHunterOnChain = async (req, res) => {
  try {
    const { address } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const hunter = await blockchain.getHunter(address);

    res.json({
      success: true,
      data: { hunter },
    });
  } catch (error) {
    console.error('Get hunter on-chain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hunter from blockchain',
    });
  }
};

/**
 * Get CRIME token balance
 */
exports.getTokenBalance = async (req, res) => {
  try {
    const { address } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const balance = await blockchain.getTokenBalance(address);
    const formattedBalance = blockchain.formatUnits(balance, 18);

    res.json({
      success: true,
      data: {
        address,
        balance,
        formattedBalance,
      },
    });
  } catch (error) {
    console.error('Get token balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token balance',
    });
  }
};

/**
 * Get staking info
 */
exports.getStakingInfo = async (req, res) => {
  try {
    const { address } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const stakeInfo = await blockchain.getStakeInfo(address);

    res.json({
      success: true,
      data: {
        stakeInfo: {
          amount: stakeInfo.amount,
          amountFormatted: blockchain.formatUnits(stakeInfo.amount, 18),
          stakedAt: stakeInfo.stakedAt,
          pendingReward: stakeInfo.pendingReward,
          pendingRewardFormatted: blockchain.formatUnits(stakeInfo.pendingReward, 18),
          totalEarned: stakeInfo.totalEarned,
          totalEarnedFormatted: blockchain.formatUnits(stakeInfo.totalEarned, 18),
        },
      },
    });
  } catch (error) {
    console.error('Get staking info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staking info',
    });
  }
};

/**
 * Check subscription status
 */
exports.checkSubscription = async (req, res) => {
  try {
    const { address } = req.params;
    const { usdtValue = 0 } = req.query;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const hasSubscription = await blockchain.hasSubscription(
      address,
      blockchain.parseUnits(usdtValue, 6) // USDT has 6 decimals
    );

    res.json({
      success: true,
      data: {
        address,
        hasSubscription,
        usdtValue,
      },
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check subscription',
    });
  }
};

/**
 * Get validation status
 */
exports.getValidationStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const status = await blockchain.getValidationStatus(submissionId);
    const votes = await blockchain.getValidationVotes(submissionId);

    res.json({
      success: true,
      data: {
        status,
        votes,
      },
    });
  } catch (error) {
    console.error('Get validation status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch validation status',
    });
  }
};

/**
 * Get vault balance
 */
exports.getVaultBalance = async (req, res) => {
  try {
    const { tokenAddress } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const balance = await blockchain.getVaultBalance(tokenAddress);

    res.json({
      success: true,
      data: {
        tokenAddress,
        balance: {
          totalDeposited: balance.totalDeposited,
          totalWithdrawn: balance.totalWithdrawn,
          availableBalance: balance.availableBalance,
          totalDepositedFormatted: blockchain.formatUnits(balance.totalDeposited, 6),
          totalWithdrawnFormatted: blockchain.formatUnits(balance.totalWithdrawn, 6),
          availableBalanceFormatted: blockchain.formatUnits(balance.availableBalance, 6),
        },
      },
    });
  } catch (error) {
    console.error('Get vault balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vault balance',
    });
  }
};

/**
 * Get multi-sig approval status
 */
exports.getApprovalStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const status = await blockchain.getApprovalStatus(requestId);
    const isFullyApproved = await blockchain.isFullyApproved(requestId);

    res.json({
      success: true,
      data: {
        requestId,
        status,
        isFullyApproved,
      },
    });
  } catch (error) {
    console.error('Get approval status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approval status',
    });
  }
};

/**
 * Get transaction status
 */
exports.getTransactionStatus = async (req, res) => {
  try {
    const { txHash } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    const receipt = await blockchain.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.json({
        success: true,
        data: {
          txHash,
          status: 'pending',
        },
      });
    }

    res.json({
      success: true,
      data: {
        txHash,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        contractAddress: receipt.contractAddress,
      },
    });
  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction status',
    });
  }
};

/**
 * Sync bounty from blockchain to database
 */
exports.syncBounty = async (req, res) => {
  try {
    const { bountyId } = req.params;

    const blockchain = getBlockchainService();
    await blockchain.initialize();

    // Get from blockchain
    const bountyData = await blockchain.getBounty(bountyId);

    // Get or create company
    let companyResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [bountyData.company.toLowerCase()]
    );

    if (companyResult.rows.length === 0) {
      companyResult = await query(
        'INSERT INTO users (wallet_address, role) VALUES ($1, $2) RETURNING id',
        [bountyData.company.toLowerCase(), 'company']
      );
    }

    const companyId = companyResult.rows[0].id;

    // Update database
    await query(
      `INSERT INTO bounties (
        bounty_id, company_id, target_contract_address, total_reward,
        remaining_reward, lock_amount, status, deadline, is_active, payment_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (bounty_id)
      DO UPDATE SET
        total_reward = EXCLUDED.total_reward,
        remaining_reward = EXCLUDED.remaining_reward,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING *`,
      [
        bountyId,
        companyId,
        bountyData.targetContract.toLowerCase(),
        bountyData.totalReward,
        bountyData.remainingReward,
        bountyData.lockAmount,
        bountyData.status,
        new Date(bountyData.deadline * 1000),
        bountyData.isActive,
        bountyData.paymentToken.toLowerCase(),
      ]
    );

    // Clear cache
    await cache.deletePattern('bounties:*');

    res.json({
      success: true,
      message: 'Bounty synced successfully',
      data: { bountyData },
    });
  } catch (error) {
    console.error('Sync bounty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync bounty',
    });
  }
};
