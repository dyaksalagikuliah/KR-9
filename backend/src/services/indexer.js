const { ethers } = require('ethers');
const { query, transaction } = require('../config/database');
const { cache } = require('../config/redis');
const { getContractAddress } = require('../contracts/addresses');
const fs = require('fs');
const path = require('path');

// Load contract ABIs
function loadABI(contractName) {
  try {
    const artifactPath = path.join(
      __dirname,
      '../../../artifacts/contracts',
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (fs.existsSync(artifactPath)) {
      return require(artifactPath).abi;
    }

    throw new Error(`ABI file not found: ${artifactPath}`);
  } catch (error) {
    console.error(`Error loading ABI for ${contractName}:`, error.message);
    throw error;
  }
}

const BOUNTY_MANAGER_ABI = loadABI('BountyManager');

class BlockchainIndexer {
  constructor() {
    this.provider = null;
    this.bountyManager = null;
    this.isRunning = false;
    this.network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia';
  }

  /**
   * Initialize indexer
   */
  async initialize() {
    console.log('🚀 Initializing Blockchain Indexer...\n');

    try {
      // Setup WebSocket provider for real-time events
      const wsUrl = process.env.ETHEREUM_WS_URL;
      this.provider = new ethers.WebSocketProvider(wsUrl);

      // Setup contract instances
      const bountyManagerAddress = getContractAddress('BountyManager', this.network);
      this.bountyManager = new ethers.Contract(
        bountyManagerAddress,
        BOUNTY_MANAGER_ABI,
        this.provider
      );

      console.log('✅ Provider connected');
      console.log('📝 BountyManager address:', process.env.BOUNTY_MANAGER_ADDRESS);
      console.log('🌐 Network:', this.network);
      console.log('');

      // Initialize indexer state
      await this.initializeState();

      console.log('✅ Indexer initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize indexer:', error);
      throw error;
    }
  }

  /**
   * Initialize indexer state in database
   */
  async initializeState() {
    const result = await query(
      `INSERT INTO indexer_state (contract_address, network, last_block)
       VALUES ($1, $2, $3)
       ON CONFLICT (contract_address, network)
       DO UPDATE SET last_updated = NOW()
       RETURNING *`,
      [
        process.env.BOUNTY_MANAGER_ADDRESS.toLowerCase(),
        this.network,
        parseInt(process.env.INDEXER_START_BLOCK) || 0,
      ]
    );

    console.log('📊 Indexer state initialized:', result.rows[0]);
  }

  /**
   * Get last indexed block
   */
  async getLastIndexedBlock() {
    const result = await query(
      'SELECT last_block FROM indexer_state WHERE contract_address = $1 AND network = $2',
      [process.env.BOUNTY_MANAGER_ADDRESS.toLowerCase(), this.network]
    );

    return result.rows[0]?.last_block || parseInt(process.env.INDEXER_START_BLOCK) || 0;
  }

  /**
   * Update last indexed block
   */
  async updateLastIndexedBlock(blockNumber) {
    await query(
      `UPDATE indexer_state
       SET last_block = $1, last_updated = NOW()
       WHERE contract_address = $2 AND network = $3`,
      [blockNumber, process.env.BOUNTY_MANAGER_ADDRESS.toLowerCase(), this.network]
    );
  }

  /**
   * Index historical events (catch up)
   */
  async indexHistoricalEvents() {
    console.log('📚 Starting historical event indexing...\n');

    try {
      const lastBlock = await this.getLastIndexedBlock();
      const currentBlock = await this.provider.getBlockNumber();
      const batchSize = parseInt(process.env.INDEXER_BATCH_SIZE) || 1000;

      console.log(`📊 Indexing from block ${lastBlock} to ${currentBlock}`);
      console.log(`📦 Batch size: ${batchSize}\n`);

      if (lastBlock >= currentBlock) {
        console.log('✅ Already up to date!\n');
        return;
      }

      for (let i = lastBlock; i <= currentBlock; i += batchSize) {
        const fromBlock = i;
        const toBlock = Math.min(i + batchSize - 1, currentBlock);

        console.log(`⏳ Processing blocks ${fromBlock} to ${toBlock}...`);

        // Index BountyCreated events
        await this.indexBountyCreatedEvents(fromBlock, toBlock);

        // Index SubmissionCreated events
        await this.indexSubmissionCreatedEvents(fromBlock, toBlock);

        // Index SubmissionValidated events
        await this.indexSubmissionValidatedEvents(fromBlock, toBlock);

        // Index RewardPaid events
        await this.indexRewardPaidEvents(fromBlock, toBlock);

        // Index BountyCompleted events
        await this.indexBountyCompletedEvents(fromBlock, toBlock);

        // Update last indexed block
        await this.updateLastIndexedBlock(toBlock);

        console.log(`✅ Processed blocks ${fromBlock} to ${toBlock}\n`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ Historical indexing completed!\n');
    } catch (error) {
      console.error('❌ Historical indexing error:', error);
      throw error;
    }
  }

  /**
   * Index BountyCreated events
   */
  async indexBountyCreatedEvents(fromBlock, toBlock) {
    const filter = this.bountyManager.filters.BountyCreated();
    const events = await this.bountyManager.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      await this.handleBountyCreated(event);
    }

    console.log(`   - Indexed ${events.length} BountyCreated events`);
  }

  /**
   * Index SubmissionCreated events
   */
  async indexSubmissionCreatedEvents(fromBlock, toBlock) {
    const filter = this.bountyManager.filters.SubmissionCreated();
    const events = await this.bountyManager.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      await this.handleSubmissionCreated(event);
    }

    console.log(`   - Indexed ${events.length} SubmissionCreated events`);
  }

  /**
   * Index SubmissionValidated events
   */
  async indexSubmissionValidatedEvents(fromBlock, toBlock) {
    const filter = this.bountyManager.filters.SubmissionValidated();
    const events = await this.bountyManager.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      await this.handleSubmissionValidated(event);
    }

    console.log(`   - Indexed ${events.length} SubmissionValidated events`);
  }

  /**
   * Index RewardPaid events
   */
  async indexRewardPaidEvents(fromBlock, toBlock) {
    const filter = this.bountyManager.filters.RewardPaid();
    const events = await this.bountyManager.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      await this.handleRewardPaid(event);
    }

    console.log(`   - Indexed ${events.length} RewardPaid events`);
  }

  /**
   * Index BountyCompleted events
   */
  async indexBountyCompletedEvents(fromBlock, toBlock) {
    const filter = this.bountyManager.filters.BountyCompleted();
    const events = await this.bountyManager.queryFilter(filter, fromBlock, toBlock);

    for (const event of events) {
      await this.handleBountyCompleted(event);
    }

    console.log(`   - Indexed ${events.length} BountyCompleted events`);
  }

  /**
   * Handle BountyCreated event
   */
  async handleBountyCreated(event) {
    const { bountyId, company, totalReward } = event.args;

    // Fetch full bounty data from contract
    const bountyData = await this.bountyManager.bounties(bountyId);

    // Get or create company user
    let companyResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [company.toLowerCase()]
    );

    if (companyResult.rows.length === 0) {
      companyResult = await query(
        `INSERT INTO users (wallet_address, role)
         VALUES ($1, $2)
         RETURNING id`,
        [company.toLowerCase(), 'company']
      );
    }

    const companyId = companyResult.rows[0].id;

    // Update or create bounty
    await query(
      `INSERT INTO bounties (
        bounty_id, company_id, target_contract_address, total_reward,
        remaining_reward, lock_amount, status, deadline, is_active,
        payment_token, block_number, tx_hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (bounty_id)
      DO UPDATE SET
        total_reward = EXCLUDED.total_reward,
        remaining_reward = EXCLUDED.remaining_reward,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()`,
      [
        bountyId.toString(),
        companyId,
        bountyData.targetContract.toLowerCase(),
        bountyData.totalReward.toString(),
        bountyData.remainingReward.toString(),
        bountyData.lockAmount.toString(),
        bountyData.status,
        new Date(Number(bountyData.deadline) * 1000),
        bountyData.isActive,
        bountyData.paymentToken.toLowerCase(),
        event.blockNumber,
        event.transactionHash,
        new Date(event.blockTimestamp * 1000),
      ]
    );

    // Clear cache
    await cache.deletePattern('bounties:*');
  }

  /**
   * Handle SubmissionCreated event
   */
  async handleSubmissionCreated(event) {
    const { submissionId, bountyId, hunter } = event.args;

    // Get submission data
    const submissionData = await this.bountyManager.submissions(submissionId);

    // Get or create hunter user
    let hunterResult = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [hunter.toLowerCase()]
    );

    if (hunterResult.rows.length === 0) {
      hunterResult = await query(
        `INSERT INTO users (wallet_address, role)
         VALUES ($1, $2)
         RETURNING id`,
        [hunter.toLowerCase(), 'hunter']
      );

      // Initialize hunter stats
      await query(
        'INSERT INTO hunter_stats (wallet_address) VALUES ($1)',
        [hunter.toLowerCase()]
      );
    }

    const hunterId = hunterResult.rows[0].id;

    // Get bounty database ID
    const bountyResult = await query(
      'SELECT id FROM bounties WHERE bounty_id = $1',
      [bountyId.toString()]
    );

    if (bountyResult.rows.length === 0) {
      console.error('Bounty not found in database:', bountyId.toString());
      return;
    }

    const bountyDbId = bountyResult.rows[0].id;

    // Update or create submission
    await query(
      `INSERT INTO submissions (
        submission_id, bounty_id, hunter_id, severity, status,
        reward_amount, submitted_at, is_paid, block_number, tx_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (submission_id)
      DO UPDATE SET
        severity = EXCLUDED.severity,
        status = EXCLUDED.status,
        reward_amount = EXCLUDED.reward_amount,
        is_paid = EXCLUDED.is_paid,
        updated_at = NOW()`,
      [
        submissionId.toString(),
        bountyDbId,
        hunterId,
        submissionData.severity,
        submissionData.status,
        submissionData.rewardAmount.toString(),
        new Date(Number(submissionData.submittedAt) * 1000),
        submissionData.isPaid,
        event.blockNumber,
        event.transactionHash,
      ]
    );

    // Update hunter stats
    await query(
      `UPDATE hunter_stats
       SET total_submissions = total_submissions + 1
       WHERE wallet_address = $1`,
      [hunter.toLowerCase()]
    );

    // Clear cache
    await cache.deletePattern('submissions:*');
    await cache.deletePattern('bounties:*');
  }

  /**
   * Handle SubmissionValidated event
   */
  async handleSubmissionValidated(event) {
    const { submissionId, severity, isValid } = event.args;

    await query(
      `UPDATE submissions
       SET severity = $1, status = $2, updated_at = NOW()
       WHERE submission_id = $3`,
      [severity, isValid ? 2 : 3, submissionId.toString()]
    );

    // Clear cache
    await cache.deletePattern('submissions:*');
  }

  /**
   * Handle RewardPaid event
   */
  async handleRewardPaid(event) {
    const { submissionId, hunter, amount } = event.args;

    await query(
      `UPDATE submissions
       SET is_paid = TRUE, reward_amount = $1, paid_at = NOW()
       WHERE submission_id = $2`,
      [amount.toString(), submissionId.toString()]
    );

    // Update hunter stats
    await query(
      `UPDATE hunter_stats
       SET total_earned = total_earned + $1,
           successful_submissions = successful_submissions + 1
       WHERE wallet_address = $2`,
      [amount.toString(), hunter.toLowerCase()]
    );

    // Clear cache
    await cache.deletePattern('submissions:*');
    await cache.deletePattern('hunters:*');
  }

  /**
   * Handle BountyCompleted event
   */
  async handleBountyCompleted(event) {
    const { bountyId } = event.args;

    await query(
      `UPDATE bounties
       SET status = 4, is_active = FALSE, updated_at = NOW()
       WHERE bounty_id = $1`,
      [bountyId.toString()]
    );

    // Clear cache
    await cache.deletePattern('bounties:*');
  }

  /**
   * Start listening to real-time events
   */
  async startRealtimeIndexing() {
    console.log('👂 Starting real-time event listening...\n');

    this.bountyManager.on('BountyCreated', async (bountyId, company, totalReward, event) => {
      console.log('📝 New BountyCreated:', bountyId.toString());
      await this.handleBountyCreated(event);
    });

    this.bountyManager.on('SubmissionCreated', async (submissionId, bountyId, hunter, event) => {
      console.log('📝 New SubmissionCreated:', submissionId.toString());
      await this.handleSubmissionCreated(event);
    });

    this.bountyManager.on('SubmissionValidated', async (submissionId, severity, isValid, event) => {
      console.log('📝 SubmissionValidated:', submissionId.toString(), isValid ? '✅' : '❌');
      await this.handleSubmissionValidated(event);
    });

    this.bountyManager.on('RewardPaid', async (submissionId, hunter, amount, event) => {
      console.log('💰 RewardPaid:', submissionId.toString(), ethers.formatUnits(amount, 6), 'USDT');
      await this.handleRewardPaid(event);
    });

    this.bountyManager.on('BountyCompleted', async (bountyId, event) => {
      console.log('✅ BountyCompleted:', bountyId.toString());
      await this.handleBountyCompleted(event);
    });

    console.log('✅ Real-time indexing started!\n');
  }

  /**
   * Start indexer
   */
  async start() {
    try {
      this.isRunning = true;

      // Initialize
      await this.initialize();

      // Index historical events first
      await this.indexHistoricalEvents();

      // Start real-time indexing
      await this.startRealtimeIndexing();

      console.log('🎉 Indexer is running!\n');
    } catch (error) {
      console.error('❌ Indexer error:', error);
      this.isRunning = false;
      process.exit(1);
    }
  }

  /**
   * Stop indexer
   */
  async stop() {
    console.log('🛑 Stopping indexer...');
    this.isRunning = false;
    this.bountyManager.removeAllListeners();
    await this.provider.destroy();
    console.log('✅ Indexer stopped');
  }
}

// Run indexer if executed directly
if (require.main === module) {
  const indexer = new BlockchainIndexer();

  indexer.start().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n');
    await indexer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await indexer.stop();
    process.exit(0);
  });
}

module.exports = BlockchainIndexer;
