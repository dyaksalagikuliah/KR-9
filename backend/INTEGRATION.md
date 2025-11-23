# Backend ↔ Smart Contract Integration Guide

Dokumentasi lengkap untuk integrasi antara Backend API dengan Smart Contracts.

## 🔗 Arsitektur Integrasi

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │────────▶│   Backend API   │────────▶│   Blockchain    │
│   (React/Web3)  │  HTTP   │   (Express)     │   RPC   │   (Smart        │
│                 │         │                 │         │   Contracts)    │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │                           │
                                     │ WebSocket Events          │
                                     │◀──────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   (Indexed DB)  │
                            └─────────────────┘
```

## 📦 Components yang Terintegrasi

### 1. **Smart Contracts (Blockchain)**
- BountyManager.sol
- VaultManager.sol
- VulnerabilityValidator.sol
- MultiSigApproval.sol
- CRIMEToken.sol

### 2. **Backend Services**
- Blockchain Service (`services/blockchain.js`)
- Indexer Service (`services/indexer.js`)
- Contract Controller (`controllers/contractController.js`)

### 3. **Database**
- PostgreSQL (indexed blockchain data)
- Redis (caching)

## 🚀 Setup Integration

### Step 1: Deploy Smart Contracts

```bash
# Di root project
cd contracts
npm install
npx hardhat compile

# Deploy ke testnet (contoh: Sepolia)
npx hardhat run scripts/deploy.js --network sepolia

# Simpan contract addresses dari output deployment
```

### Step 2: Configure Backend

```bash
# Di backend folder
cd backend

# Copy .env.example ke .env
cp .env.example .env
```

Edit `.env` dan tambahkan contract addresses:

```env
# Network Configuration
NETWORK=sepolia
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
ETHEREUM_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Contract Addresses (dari deployment output)
BOUNTY_MANAGER_ADDRESS=0x1234...
VAULT_MANAGER_ADDRESS=0x5678...
VALIDATOR_ADDRESS=0x9abc...
MULTISIG_ADDRESS=0xdef0...
CRIME_TOKEN_ADDRESS=0x1111...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/proof_of_crime
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_here
```

### Step 3: Setup Database

```bash
# Create database
createdb proof_of_crime

# Run migrations
npm run migrate
```

### Step 4: Start Services

```bash
# Terminal 1: Start API Server
npm run dev

# Terminal 2: Start Blockchain Indexer
npm run indexer
```

## 📡 Blockchain Service Usage

### Initialize Service

```javascript
const { getBlockchainService } = require('./services/blockchain');

// Get singleton instance
const blockchain = getBlockchainService();

// Initialize (connect to blockchain)
await blockchain.initialize();
```

### Read Contract Data

```javascript
// Get bounty from blockchain
const bounty = await blockchain.getBounty(bountyId);
console.log('Bounty:', bounty);

// Get submission
const submission = await blockchain.getSubmission(submissionId);

// Get hunter stats
const hunter = await blockchain.getHunter(hunterAddress);

// Get CRIME token balance
const balance = await blockchain.getTokenBalance(userAddress);

// Get staking info
const stakeInfo = await blockchain.getStakeInfo(userAddress);
```

### Utility Functions

```javascript
// Format wei to human-readable
const formatted = blockchain.formatUnits('1000000000000000000', 18);
// Result: "1.0"

// Parse human-readable to wei
const wei = blockchain.parseUnits('1.0', 18);
// Result: BigInt

// Get current block
const blockNumber = await blockchain.getBlockNumber();

// Get gas price
const gasPrice = await blockchain.getGasPrice();

// Check transaction status
const receipt = await blockchain.getTransactionReceipt(txHash);
```

## 🔄 Blockchain Indexer

Indexer berjalan sebagai service terpisah yang:
1. Mendengarkan events dari smart contracts
2. Menyimpan data ke PostgreSQL
3. Update cache di Redis
4. Trigger WebSocket notifications

### Events yang Diindex

```javascript
// BountyManager Events
- BountyCreated(uint256 bountyId, address company, uint256 totalReward)
- SubmissionCreated(uint256 submissionId, uint256 bountyId, address hunter)
- SubmissionValidated(uint256 submissionId, uint8 severity, bool isValid)
- RewardPaid(uint256 submissionId, address hunter, uint256 amount)
- BountyCompleted(uint256 bountyId)
```

### Indexer Flow

```javascript
// 1. Historical Indexing (catch up dari last block)
await indexer.indexHistoricalEvents(fromBlock, toBlock);

// 2. Real-time Listening
bountyManager.on('BountyCreated', async (bountyId, company, reward, event) => {
  // Fetch full data
  const bountyData = await bountyManager.bounties(bountyId);

  // Save to database
  await saveToDatabase(bountyData);

  // Clear cache
  await cache.del('bounties:list');

  // Emit WebSocket event
  io.emit('bounty_created', { bountyId, company, reward });
});
```

### Monitor Indexer

```bash
# Check indexer status
curl http://localhost:3000/api/v1/contracts

# Response:
{
  "success": true,
  "data": {
    "network": "sepolia",
    "blockNumber": 5234567,
    "contracts": {
      "BountyManager": "0x1234...",
      "VaultManager": "0x5678...",
      ...
    }
  }
}
```

## 🌐 API Endpoints

### Contract Data Endpoints

```bash
# Get contract info
GET /api/v1/contracts

# Get bounty from blockchain
GET /api/v1/contracts/bounties/:bountyId

# Get submission from blockchain
GET /api/v1/contracts/submissions/:submissionId

# Get hunter stats from blockchain
GET /api/v1/contracts/hunters/:address

# Get token balance
GET /api/v1/contracts/token/balance/:address

# Get staking info
GET /api/v1/contracts/token/staking/:address

# Check subscription
GET /api/v1/contracts/token/subscription/:address?usdtValue=2000

# Get validation status
GET /api/v1/contracts/validation/:submissionId

# Get vault balance
GET /api/v1/contracts/vault/:tokenAddress

# Get approval status
GET /api/v1/contracts/approval/:requestId

# Get transaction status
GET /api/v1/contracts/tx/:txHash

# Manually sync bounty (Admin only)
POST /api/v1/contracts/sync/bounty/:bountyId
```

### Example API Calls

```javascript
// Frontend JavaScript
const API_URL = 'http://localhost:3000/api/v1';

// Get bounty from blockchain
async function getBountyOnChain(bountyId) {
  const response = await fetch(`${API_URL}/contracts/bounties/${bountyId}`);
  const data = await response.json();
  return data.data.bounty;
}

// Get user's CRIME token balance
async function getTokenBalance(address) {
  const response = await fetch(`${API_URL}/contracts/token/balance/${address}`);
  const data = await response.json();
  return data.data.formattedBalance; // "1234.5678"
}

// Get staking rewards
async function getStakingRewards(address) {
  const response = await fetch(`${API_URL}/contracts/token/staking/${address}`);
  const data = await response.json();
  return data.data.stakeInfo;
}

// Check transaction status
async function checkTx(txHash) {
  const response = await fetch(`${API_URL}/contracts/tx/${txHash}`);
  const data = await response.json();
  return data.data.status; // 'pending', 'success', 'failed'
}
```

## 🔄 Data Flow

### Creating Bounty Flow

```
1. Frontend: User creates bounty on-chain
   ↓
   const tx = await bountyManager.createBounty(...)
   await tx.wait()

2. Blockchain: Event emitted
   ↓
   event BountyCreated(bountyId, company, reward)

3. Indexer: Catches event
   ↓
   handleBountyCreated(event)

4. Database: Data saved
   ↓
   INSERT INTO bounties (...)

5. Cache: Cleared
   ↓
   cache.del('bounties:*')

6. WebSocket: Notification sent
   ↓
   io.emit('bounty_created', data)

7. Frontend: UI updated
   ↓
   socket.on('bounty_created', updateUI)
```

### Submission Flow

```
1. Frontend: Create off-chain submission draft
   POST /api/v1/submissions

2. Backend: Save to database
   INSERT INTO submissions (...)

3. Frontend: Submit on-chain
   const tx = await bountyManager.submitFinding(...)

4. Indexer: Update database with on-chain data
   UPDATE submissions SET submission_id = ...

5. Validators: Vote on-chain
   validator.castVote(submissionId, severity, isValid)

6. Indexer: Update validation status
   UPDATE submissions SET severity = ..., status = ...

7. BountyManager: Pay reward
   bountyManager.payReward(submissionId)

8. Indexer: Update payment status
   UPDATE submissions SET is_paid = true
```

## 🔍 Querying Data

### Best Practices

**1. Use Database for Listing & Filtering**
```javascript
// ✅ GOOD - Fast, supports filtering
const bounties = await query(`
  SELECT * FROM bounties
  WHERE status = 0 AND category = 'smart-contract'
  ORDER BY created_at DESC
  LIMIT 20
`);
```

```javascript
// ❌ BAD - Slow, expensive RPC calls
for (let i = 0; i < 1000; i++) {
  const bounty = await blockchain.getBounty(i);
  // 1000 RPC calls!
}
```

**2. Use Blockchain for Verification**
```javascript
// Verify critical data from blockchain
const onChainData = await blockchain.getBounty(bountyId);
const dbData = await query('SELECT * FROM bounties WHERE bounty_id = $1', [bountyId]);

// Compare
if (onChainData.totalReward !== dbData.total_reward) {
  console.warn('Data mismatch! Re-syncing...');
  await syncBounty(bountyId);
}
```

**3. Cache Frequently Accessed Data**
```javascript
// Check cache first
let bounty = await cache.get(`bounty:${bountyId}`);

if (!bounty) {
  // Get from database
  bounty = await query('SELECT * FROM bounties WHERE bounty_id = $1', [bountyId]);

  // Cache for 5 minutes
  await cache.set(`bounty:${bountyId}`, bounty, 300);
}
```

## 🔐 Security Considerations

### 1. RPC Rate Limiting
```javascript
// Use Redis to track RPC calls
const key = `rpc:calls:${Date.now()}`;
const calls = await redis.incr(key);
await redis.expire(key, 60);

if (calls > 100) {
  throw new Error('RPC rate limit exceeded');
}
```

### 2. Data Validation
```javascript
// Always validate blockchain data
function validateBountyData(data) {
  assert(ethers.isAddress(data.company), 'Invalid company address');
  assert(data.totalReward > 0, 'Invalid reward amount');
  assert(data.deadline > Date.now() / 1000, 'Invalid deadline');
}
```

### 3. Error Handling
```javascript
// Graceful degradation
try {
  const bounty = await blockchain.getBounty(bountyId);
  return bounty;
} catch (error) {
  console.error('Blockchain error:', error);

  // Fallback to database
  const dbBounty = await query('SELECT * FROM bounties WHERE bounty_id = $1', [bountyId]);
  return dbBounty;
}
```

## 🧪 Testing Integration

### Test Blockchain Service

```javascript
// test/blockchain.test.js
const { getBlockchainService } = require('../src/services/blockchain');

describe('Blockchain Service', () => {
  let blockchain;

  beforeAll(async () => {
    blockchain = getBlockchainService('localhost');
    await blockchain.initialize();
  });

  test('should get bounty data', async () => {
    const bounty = await blockchain.getBounty(0);
    expect(bounty).toBeDefined();
    expect(bounty.id).toBe(0);
  });

  test('should format units correctly', () => {
    const formatted = blockchain.formatUnits('1000000000000000000', 18);
    expect(formatted).toBe('1.0');
  });
});
```

### Test Indexer

```bash
# Run indexer in test mode
NETWORK=localhost npm run indexer

# Check database
psql proof_of_crime -c "SELECT COUNT(*) FROM bounties;"
```

## 📊 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Indexer status (check logs)
tail -f logs/indexer.log

# Database connections
psql proof_of_crime -c "SELECT count(*) FROM pg_stat_activity;"

# Redis status
redis-cli INFO stats
```

### Metrics to Monitor

1. **Indexer Lag**: Current block vs last indexed block
2. **RPC Response Time**: Average time for RPC calls
3. **Database Query Time**: Slow query log
4. **Cache Hit Rate**: Redis hit/miss ratio
5. **WebSocket Connections**: Active connections count

## 🚨 Troubleshooting

### Indexer Not Syncing

```bash
# Check RPC connection
curl $ETHEREUM_RPC_URL

# Check contract address
psql proof_of_crime -c "SELECT * FROM indexer_state;"

# Reset indexer state (CAREFUL!)
UPDATE indexer_state SET last_block = 0;
```

### Database Out of Sync

```bash
# Manual sync specific bounty
curl -X POST http://localhost:3000/api/v1/contracts/sync/bounty/123 \
  -H "Authorization: Bearer $TOKEN"

# Re-index from specific block
# Edit INDEXER_START_BLOCK in .env
# Restart indexer
```

### RPC Errors

```javascript
// Implement retry logic
async function retryRPC(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// Usage
const bounty = await retryRPC(() => blockchain.getBounty(id));
```

## 📚 Additional Resources

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

---

**Integration Complete! Backend sudah fully connected dengan Smart Contracts** 🎉

