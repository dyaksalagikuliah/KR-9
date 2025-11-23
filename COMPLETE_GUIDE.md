# 🎉 Proof of Crime - Complete Full-Stack Platform

**Panduan lengkap untuk menjalankan seluruh sistem dari Smart Contracts hingga Frontend**

## 📦 Apa yang Sudah Dibuat?

### 1. ⛓️ **Smart Contracts** (Solidity)
✅ BountyManager.sol - Main bounty logic
✅ VaultManager.sol - Fund management
✅ VulnerabilityValidator.sol - Multi-sig validation
✅ MultiSigApproval.sol - 3-wallet approval system
✅ CRIMEToken.sol - Platform token dengan staking

### 2. 🔧 **Backend API** (Node.js + Express)
✅ REST API dengan 50+ endpoints
✅ PostgreSQL database dengan full schema
✅ Redis caching layer
✅ Blockchain indexer (real-time event sync)
✅ WebSocket untuk real-time updates
✅ JWT authentication dengan wallet signature
✅ Full integration dengan smart contracts

### 3. 🎨 **Frontend** (Next.js 14 + TypeScript)
✅ Modern UI dengan Tailwind CSS
✅ Privy SDK untuk wallet connection
✅ React Query untuk data fetching
✅ Real-time updates via WebSocket
✅ Responsive design (mobile-first)
✅ Dark theme dengan cyber aesthetic

## 🚀 Quick Start (Semua Komponen)

### Prerequisites Checklist

- [ ] Node.js >= 16.0.0
- [ ] PostgreSQL >= 13
- [ ] Redis >= 6.0
- [ ] MetaMask atau wallet lainnya
- [ ] Alchemy account (untuk RPC)
- [ ] Privy account (untuk frontend auth)

### Step 1: Clone & Setup Root

```bash
git clone <your-repo>
cd "KR 9"

# Install dependencies untuk contracts
npm install
```

### Step 2: Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Option A: Deploy ke Local Network
# Terminal 1:
npx hardhat node

# Terminal 2:
npx hardhat run scripts/deploy.js --network localhost

# Option B: Deploy ke Sepolia Testnet
# Edit .env dengan your PRIVATE_KEY dan SEPOLIA_RPC_URL
npx hardhat run scripts/deploy.js --network sepolia
```

**PENTING: Simpan contract addresses yang muncul setelah deployment!**

```
BountyManager deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
VaultManager deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VulnerabilityValidator deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
MultiSigApproval deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
CRIMEToken deployed to: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Setup database
createdb proof_of_crime

# Create .env
cp .env.example .env

# Edit backend/.env dengan:
# - Database credentials
# - Contract addresses (dari step 2)
# - JWT secrets
# - RPC URLs
nano .env
```

**Minimal backend/.env:**
```env
NODE_ENV=development
PORT=3000
NETWORK=localhost

# Database
DATABASE_URL=postgresql://postgres:yourpass@localhost:5432/proof_of_crime
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proof_of_crime
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_random_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Blockchain (localhost)
ETHEREUM_RPC_URL=http://127.0.0.1:8545
ETHEREUM_WS_URL=ws://127.0.0.1:8545

# Contract Addresses (dari deployment step 2)
BOUNTY_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VAULT_MANAGER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VALIDATOR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
MULTISIG_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
CRIME_TOKEN_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

# Indexer
INDEXER_START_BLOCK=0
```

```bash
# Run migrations
npm run migrate

# Copy ABIs dari contracts ke backend
cd ..
node scripts/copy-abis.js
cd backend
```

### Step 4: Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Edit frontend/.env.local
nano .env.local
```

**Minimal frontend/.env.local:**
```env
# API (backend URL)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Privy (dapatkan dari https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Blockchain
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK_NAME=localhost
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Contract Addresses (sama dengan backend)
NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_VAULT_MANAGER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_VALIDATOR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_MULTISIG_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
NEXT_PUBLIC_CRIME_TOKEN_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
```

### Step 5: Get Privy App ID

1. Buka https://dashboard.privy.io
2. Sign up / Login
3. Create New App
4. Copy App ID
5. Paste ke `NEXT_PUBLIC_PRIVY_APP_ID` di frontend/.env.local

### Step 6: Start All Services

Buka **4 Terminal** berbeda:

**Terminal 1: Hardhat Node (jika menggunakan localhost)**
```bash
npx hardhat node
# Keep running
```

**Terminal 2: Backend API**
```bash
cd backend
npm run dev

# Output:
# ============================================================
# 🚀 Proof of Crime Backend Server
# 📍 Server running on port 3000
# ============================================================
```

**Terminal 3: Blockchain Indexer**
```bash
cd backend
npm run indexer

# Output:
# 🚀 Initializing Blockchain Indexer...
# ✅ Provider connected
# 🎉 Indexer is running!
```

**Terminal 4: Frontend**
```bash
cd frontend
npm run dev

# Output:
# ▲ Next.js 14.0.4
# - Local:        http://localhost:3001
```

### Step 7: Verify Everything Works

1. **Check Backend Health**
```bash
curl http://localhost:3000/health
```

2. **Check Contract Connection**
```bash
curl http://localhost:3000/api/v1/contracts
```

3. **Open Frontend**
```
http://localhost:3001
```

4. **Connect Wallet**
- Click "Connect Wallet"
- Select wallet (MetaMask)
- Sign message
- You're in!

## 🎯 Full System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROOF OF CRIME PLATFORM                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   FRONTEND   │────────▶│   BACKEND    │────────▶│  BLOCKCHAIN  │
│  (Next.js)   │  HTTP   │  (Express)   │   RPC   │    (EVM)     │
│              │  WS     │              │         │              │
│  Port: 3001  │         │  Port: 3000  │         │ Smart        │
└──────────────┘         └──────┬───────┘         │ Contracts    │
                                 │                 └──────────────┘
                                 │                        │
                                 │                Events  │
                                 │                        ▼
                                 │                 ┌──────────────┐
                                 │                 │   INDEXER    │
                                 │◄────────────────│  (Sync DB)   │
                                 │                 └──────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌─────────┐ ┌─────────┐
              │PostgreSQL│ │  Redis  │ │WebSocket│
              │   (DB)   │ │ (Cache) │ │  (WS)   │
              └──────────┘ └─────────┘ └─────────┘
```

## 📁 Complete Directory Structure

```
KR 9/
├── contracts/                      # Smart Contracts
│   ├── BountyManager.sol
│   ├── VaultManager.sol
│   ├── VulnerabilityValidator.sol
│   ├── MultiSigApproval.sol
│   ├── CRIMEToken.sol
│   └── artifacts/                 # Compiled contracts
│
├── backend/                       # Backend API
│   ├── src/
│   │   ├── config/               # Database, Redis config
│   │   ├── controllers/          # API controllers
│   │   ├── routes/               # API routes
│   │   ├── services/             # Blockchain service, Indexer
│   │   ├── middleware/           # Auth, validation
│   │   ├── database/             # Schema, migrations
│   │   └── server.js             # Main server
│   ├── .env                      # Backend config
│   └── package.json
│
├── frontend/                      # Frontend App
│   ├── src/
│   │   ├── app/                  # Next.js pages
│   │   ├── components/           # React components
│   │   ├── config/               # Privy, contracts config
│   │   ├── hooks/                # Custom hooks
│   │   └── lib/                  # Utilities
│   ├── .env.local                # Frontend config
│   └── package.json
│
├── scripts/                       # Utility scripts
│   ├── deploy.js                 # Deploy contracts
│   └── copy-abis.js              # Copy ABIs to backend
│
├── QUICKSTART.md                  # Quick start guide
├── COMPLETE_GUIDE.md              # This file
└── README.md                      # Main README
```

## 🔄 Development Workflow

### Making Changes to Smart Contracts

```bash
# 1. Edit contract
nano contracts/BountyManager.sol

# 2. Recompile
npx hardhat compile

# 3. Redeploy
npx hardhat run scripts/deploy.js --network localhost

# 4. Update addresses in:
#    - backend/.env
#    - frontend/.env.local

# 5. Copy new ABIs
node scripts/copy-abis.js

# 6. Restart backend & indexer
cd backend
# Ctrl+C both terminals
npm run dev      # Terminal 2
npm run indexer  # Terminal 3
```

### Adding New API Endpoints

```bash
# 1. Create controller
touch backend/src/controllers/myController.js

# 2. Create routes
touch backend/src/routes/myRoutes.js

# 3. Register routes in server.js
# Add: app.use('/api/v1/my-route', myRoutes);

# 4. Server auto-reloads (nodemon)
```

### Adding New Frontend Pages

```bash
# 1. Create page
mkdir -p frontend/src/app/my-page
touch frontend/src/app/my-page/page.tsx

# 2. Add content
# Next.js auto-reloads
```

## 🧪 Testing the Full Stack

### Test 1: Create Bounty On-Chain

```javascript
// Using Hardhat console
npx hardhat console --network localhost

const BountyManager = await ethers.getContractFactory("BountyManager");
const bountyManager = BountyManager.attach("0x5FbDB...");

// Create bounty
await bountyManager.createBounty(
  "0x1234567890123456789012345678901234567890",
  ethers.parseUnits("50000", 6),
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  "0xUSDT_ADDRESS"
);
```

**Expected:**
- Indexer logs: "📝 New BountyCreated: 0"
- Database updated: `psql proof_of_crime -c "SELECT * FROM bounties;"`
- Frontend updates: Refresh bounty list

### Test 2: API Endpoints

```bash
# Get bounties
curl http://localhost:3000/api/v1/bounties

# Get contract info
curl http://localhost:3000/api/v1/contracts

# Login (requires wallet signature)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x...","signature":"0x...","message":"..."}'
```

### Test 3: Frontend Features

1. Open http://localhost:3001
2. Click "Connect Wallet"
3. Select MetaMask
4. Sign message
5. Navigate to Bounties page
6. See live bounty list
7. Check dashboard for stats

## 📊 Monitoring

### Check Service Health

```bash
# Backend API
curl http://localhost:3000/health

# Database
psql proof_of_crime -c "SELECT COUNT(*) FROM bounties;"

# Redis
redis-cli ping

# Indexer (check logs)
# Should show: "🎉 Indexer is running!"
```

### View Logs

```bash
# Backend API logs
# Terminal 2 shows all API requests

# Indexer logs
# Terminal 3 shows blockchain events

# Frontend logs
# Terminal 4 shows Next.js build info

# Database queries
# Check terminal 2 for query logs
```

## 🚨 Common Issues & Solutions

### Issue: "Cannot connect to database"

```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in backend/.env
# Try manual connection:
psql -U postgres -d proof_of_crime
```

### Issue: "Indexer not syncing"

```bash
# Check contract addresses in backend/.env
# Restart indexer:
cd backend
# Ctrl+C
npm run indexer
```

### Issue: "Privy connection failed"

```bash
# Check NEXT_PUBLIC_PRIVY_APP_ID in frontend/.env.local
# Verify App ID di https://dashboard.privy.io
# Clear browser cache
```

### Issue: "Transaction failing"

```bash
# Check wallet has ETH for gas
# Check contract addresses match
# Check network matches (localhost/sepolia)
# Verify ABI is up to date (run copy-abis.js)
```

## 🎯 Features Checklist

### ✅ Implemented

- [x] Smart contract deployment
- [x] Backend API with authentication
- [x] Database with full schema
- [x] Blockchain event indexer
- [x] Real-time WebSocket updates
- [x] Frontend with Privy wallet auth
- [x] Bounty browsing
- [x] Contract interaction UI
- [x] Dashboard statistics
- [x] Responsive design

### 🚧 Ready to Implement (Roadmap)

- [ ] IPFS file upload for submissions
- [ ] Email notifications
- [ ] DAO ChatFi forum
- [ ] Criminal records tracking
- [ ] Advanced analytics
- [ ] Validator node system
- [ ] Mobile app
- [ ] Multi-chain support

## 📚 Documentation Links

- [Smart Contracts README](README.md)
- [Backend README](backend/README.md)
- [Backend Integration Guide](backend/INTEGRATION.md)
- [Frontend README](frontend/README.md)
- [Quick Start Guide](QUICKSTART.md)

## 🎉 You're All Set!

Jika semua terminal menampilkan output yang benar, Anda sekarang memiliki:

✅ Smart contracts deployed dan running
✅ Backend API server berjalan di port 3000
✅ Blockchain indexer syncing events
✅ PostgreSQL database dengan indexed data
✅ Redis caching layer
✅ Frontend app berjalan di port 3001
✅ Privy wallet authentication working
✅ Real-time WebSocket updates
✅ Full Web3 bounty platform!

**🚀 Platform Anda sekarang LIVE dan siap digunakan!**

## 🆘 Need Help?

Jika ada masalah:

1. Check all terminals untuk error messages
2. Verify .env files di backend dan frontend
3. Restart services satu per satu
4. Check dokumentasi di masing-masing folder
5. Review logs untuk debugging

---

**Happy Hunting! 🎯**
**Built with ❤️ for a safer Web3 ecosystem**
