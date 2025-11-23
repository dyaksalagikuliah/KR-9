# 🚀 Proof of Crime - Quick Start Guide

Panduan lengkap untuk menjalankan full-stack Proof of Crime Platform (Smart Contracts + Backend + Indexer).

## 📋 Prerequisites

Pastikan sudah terinstall:
- [x] Node.js >= 16.0.0
- [x] PostgreSQL >= 13
- [x] Redis >= 6.0
- [x] Git
- [x] MetaMask atau wallet lainnya

## 🎯 Project Structure

```
KR 9/
├── contracts/              # Smart Contracts (Solidity)
│   ├── BountyManager.sol
│   ├── VaultManager.sol
│   ├── VulnerabilityValidator.sol
│   ├── MultiSigApproval.sol
│   └── CRIMEToken.sol
│
├── backend/                # Backend API (Node.js)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── database/
│   └── package.json
│
├── scripts/                # Deployment & utility scripts
│   ├── deploy.js
│   └── copy-abis.js
│
└── README.md
```

## 🔧 Step-by-Step Setup

### Step 1: Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd "KR 9"

# Install root dependencies (contracts)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Compile Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Output akan ada di: artifacts/contracts/
```

### Step 3: Deploy Smart Contracts

#### Option A: Deploy ke Local Hardhat Network

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### Option B: Deploy ke Testnet (Sepolia)

```bash
# Setup .env di root
cp .env.example .env

# Edit .env:
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
PRIVATE_KEY=your_deployer_private_key

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
```

**Simpan Contract Addresses dari output deployment!**

```
BountyManager deployed to: 0x1234...
VaultManager deployed to: 0x5678...
VulnerabilityValidator deployed to: 0x9abc...
MultiSigApproval deployed to: 0xdef0...
CRIMEToken deployed to: 0x1111...
```

### Step 4: Copy ABIs ke Backend

```bash
# Copy ABIs dari artifacts ke backend
node scripts/copy-abis.js

# Output:
# ✓ BountyManager: ABI copied successfully
# ✓ VaultManager: ABI copied successfully
# ✓ VulnerabilityValidator: ABI copied successfully
# ✓ MultiSigApproval: ABI copied successfully
# ✓ CRIMEToken: ABI copied successfully
```

### Step 5: Setup Database

```bash
# Create PostgreSQL database
createdb proof_of_crime

# Atau via psql:
psql -U postgres
CREATE DATABASE proof_of_crime;
\q
```

### Step 6: Setup Backend Environment

```bash
cd backend

# Copy .env.example
cp .env.example .env

# Edit .env dengan:
nano .env
```

Minimal configuration:

```env
# Server
NODE_ENV=development
PORT=3000
NETWORK=localhost  # atau 'sepolia' jika deploy ke testnet

# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/proof_of_crime
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proof_of_crime
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_random_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key

# Blockchain RPC
ETHEREUM_RPC_URL=http://127.0.0.1:8545  # untuk localhost
ETHEREUM_WS_URL=ws://127.0.0.1:8545

# Contract Addresses (paste dari deployment output)
BOUNTY_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VAULT_MANAGER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VALIDATOR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
MULTISIG_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
CRIME_TOKEN_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

# Indexer
INDEXER_START_BLOCK=0
INDEXER_BATCH_SIZE=1000
```

### Step 7: Run Database Migrations

```bash
# Masih di folder backend
npm run migrate

# Output:
# 🚀 Starting database migration...
# ✅ Database migration completed successfully!
```

### Step 8: Start Redis

```bash
# Start Redis server
redis-server

# Or if using Homebrew (Mac):
brew services start redis

# Or if using systemd (Linux):
sudo systemctl start redis
```

### Step 9: Start Backend API

```bash
# Terminal 1: Start API server
cd backend
npm run dev

# Output:
# ============================================================
# 🚀 Proof of Crime Backend Server
# ============================================================
# 📍 Server running on port 3000
# 🌐 Environment: development
# 🔗 API URL: http://localhost:3000/api/v1
# 💓 Health check: http://localhost:3000/health
# ============================================================
```

### Step 10: Start Blockchain Indexer

```bash
# Terminal 2: Start indexer
cd backend
npm run indexer

# Output:
# 🚀 Initializing Blockchain Indexer...
# ✅ Provider connected
# 📝 BountyManager address: 0x5FbDB...
# 🌐 Network: localhost
# ✅ Indexer initialized successfully
# 📚 Starting historical event indexing...
# 🎉 Indexer is running!
```

## ✅ Verify Everything Works

### 1. Check API Health

```bash
curl http://localhost:3000/health

# Expected:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-23T...",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Check Contract Connection

```bash
curl http://localhost:3000/api/v1/contracts

# Expected:
{
  "success": true,
  "data": {
    "network": "localhost",
    "blockNumber": 123,
    "contracts": {
      "BountyManager": "0x5FbDB...",
      "VaultManager": "0xe7f17...",
      ...
    }
  }
}
```

### 3. Check Database

```bash
# Check tables created
psql proof_of_crime -c "\dt"

# Expected output:
#  Schema |         Name          | Type  |  Owner
# --------+-----------------------+-------+----------
#  public | bounties              | table | postgres
#  public | users                 | table | postgres
#  public | submissions           | table | postgres
#  ...
```

### 4. Check Redis

```bash
redis-cli ping

# Expected: PONG
```

## 🧪 Test The System

### Test 1: Create a Bounty (via Smart Contract)

```javascript
// Using ethers.js in Node.js or browser console
const { ethers } = require('ethers');

// Connect to local network
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const signer = await provider.getSigner();

// Load contract
const bountyManager = new ethers.Contract(
  '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Your deployed address
  BOUNTY_MANAGER_ABI,
  signer
);

// Create bounty
const tx = await bountyManager.createBounty(
  '0x1234567890123456789012345678901234567890', // target contract
  ethers.parseUnits('50000', 6), // 50k USDT reward
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  '0xUSDT_TOKEN_ADDRESS'
);

await tx.wait();
console.log('Bounty created!', tx.hash);
```

### Test 2: Check Indexer Synced the Bounty

```bash
# Wait a few seconds for indexer to process

# Check database
psql proof_of_crime -c "SELECT * FROM bounties;"

# Check via API
curl http://localhost:3000/api/v1/bounties
```

### Test 3: Register as Hunter

```bash
# Get nonce
curl http://localhost:3000/api/v1/auth/nonce/0xYOUR_WALLET_ADDRESS

# Sign message with MetaMask

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xYOUR_WALLET",
    "signature": "0xSIGNATURE",
    "message": "Sign this message..."
  }'

# You'll get accessToken
```

## 📁 Project Files Overview

### Smart Contracts
- `BountyManager.sol` - Main bounty logic
- `VaultManager.sol` - Fund management
- `VulnerabilityValidator.sol` - Multi-sig validation
- `MultiSigApproval.sol` - 3-wallet approval system
- `CRIMEToken.sol` - Platform token

### Backend Services
- `services/blockchain.js` - Contract interaction wrapper
- `services/indexer.js` - Event listener & database sync
- `controllers/contractController.js` - Blockchain API endpoints
- `controllers/bountyController.js` - Bounty business logic
- `controllers/authController.js` - Authentication

### API Routes
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/bounties/*` - Bounty CRUD operations
- `/api/v1/submissions/*` - Submission management
- `/api/v1/users/*` - User profiles
- `/api/v1/contracts/*` - Direct blockchain queries

## 🔧 Development Workflow

### Making Changes to Smart Contracts

```bash
# 1. Edit contract
nano contracts/BountyManager.sol

# 2. Recompile
npx hardhat compile

# 3. Redeploy
npx hardhat run scripts/deploy.js --network localhost

# 4. Update contract addresses in backend/.env

# 5. Copy new ABIs
node scripts/copy-abis.js

# 6. Restart backend & indexer
```

### Making Changes to Backend

```bash
# Backend auto-reloads with nodemon
cd backend
npm run dev

# Just save your files and it will restart
```

### Reset Everything

```bash
# 1. Stop all services (Ctrl+C)

# 2. Reset Hardhat network (if using local)
# Just restart: npx hardhat node

# 3. Drop and recreate database
dropdb proof_of_crime
createdb proof_of_crime

# 4. Re-run migrations
cd backend
npm run migrate

# 5. Restart everything
```

## 🚨 Troubleshooting

### Problem: "Cannot connect to database"

```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in .env
# Try connecting manually:
psql -U postgres -d proof_of_crime
```

### Problem: "Cannot connect to blockchain"

```bash
# If using localhost: Check Hardhat node is running
npx hardhat node

# If using testnet: Check RPC URL in .env
curl $ETHEREUM_RPC_URL
```

### Problem: "Indexer not syncing"

```bash
# Check indexer logs
# Make sure contract addresses are correct in .env
# Check INDEXER_START_BLOCK is set to 0 for fresh sync
# Restart indexer
```

### Problem: "Module not found"

```bash
# Re-install dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# For contracts
cd ..
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Frontend Integration**: Build React app with Web3
2. **IPFS Integration**: Add file upload for submissions
3. **Email Notifications**: Configure NodeMailer
4. **Testing**: Write comprehensive tests
5. **Deployment**: Deploy to production (mainnet/polygon)
6. **Monitoring**: Setup logging and monitoring tools

## 📖 Documentation

- [Backend README](backend/README.md)
- [Integration Guide](backend/INTEGRATION.md)
- [Smart Contracts README](README.md)
- [Architecture Doc](ARCHITECTURE.md)

## 🆘 Need Help?

- Check logs: `backend/logs/app.log`
- Database issues: Check `psql` connection
- Blockchain issues: Verify RPC URL and contract addresses
- Join Discord: [Coming Soon]

## 🎉 Success!

Jika semua berjalan dengan baik, Anda sekarang memiliki:

- ✅ Smart Contracts deployed & running
- ✅ Backend API server running
- ✅ Blockchain indexer syncing events
- ✅ Database storing indexed data
- ✅ Redis caching working
- ✅ WebSocket real-time updates ready

**Selamat! Full-stack Web3 platform Anda sudah running!** 🚀

---

**Built with ❤️ for Proof of Crime Platform**
