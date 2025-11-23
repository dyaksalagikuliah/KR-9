# Proof of Crime - Smart Contract Bounty Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow.svg)](https://hardhat.org/)

> Decentralized platform for smart contract security audits, bug bounties, and web3 crime tracking.

## 🎯 Overview

Proof of Crime is a comprehensive blockchain-based platform designed to address critical issues in the Web3 security ecosystem:

- **Smart Contract Audit Bounties**: Companies can create bounties for security researchers to find vulnerabilities
- **Criminal Record Tracking**: On-chain tracking of Web3 crimes and criminals (Roadmap)
- **Multi-Sig Approval System**: Secure fund management with professional validators
- **Tokenized Rewards**: CRIME token for staking, governance, and platform access

## 🏗️ System Architecture

```
┌─────────────────┐
│ Bounty Hunter   │
│ Join Competition│
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Company Lock    │─────▶│     Bounty       │
│ 100k USDT       │      │   (Active)       │
└─────────────────┘      └────────┬─────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  ▼               ▼               ▼
         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │  High Vuln  │ │ Medium Vuln │ │  Low Vuln   │
         │  $50k USD   │ │  $25k USD   │ │  $10k USD   │
         └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │    Valid     │
                        │  (Validated) │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐       ┌─────────────────┐
                        │  Open Vault  │◀──────│ Multi-Sig       │
                        │              │       │ Approval        │
                        └──────┬───────┘       │ (3 Wallets)     │
                               │               └─────────────────┘
                               ▼
                        ┌──────────────┐
                        │Bounty Hunter │
                        │  (Rewarded)  │
                        └──────────────┘
```

## 📋 Features

### ✅ Core Features (Implemented)

- **Bounty Management**
  - Create bounties with locked funds (100k USDT minimum)
  - Severity-based rewards (High: $50k, Medium: $25k, Low: $10k)
  - Automated validation workflow
  - Multi-signature approval for fund releases

- **Vulnerability Validation**
  - Professional validator network
  - Consensus-based severity assessment
  - Reputation system for validators
  - Transparent voting mechanism

- **Secure Vault System**
  - Isolated fund management
  - Multi-sig approvals for large withdrawals
  - Platform fee collection (5% default)
  - Emergency withdrawal capabilities

- **CRIME Token**
  - Staking with 12% APY
  - Subscription requirements (2k USDT or staked CRIME)
  - Governance capabilities (Roadmap)

### 🚀 Roadmap Features

- Criminal record tracking on-chain
- WorldApp integration for biometric verification
- Revoke transaction functionality
- Scam/rugpull detector
- On-chain risk rating
- Social media for web3 crime
- DAO ChatFi for community governance
- Validator node system
- Premium features and tools

## 🔧 Smart Contracts

### Core Contracts

| Contract | Description | Address |
|----------|-------------|---------|
| **BountyManager** | Main bounty lifecycle management | TBD |
| **VulnerabilityValidator** | Multi-sig validation system | TBD |
| **VaultManager** | Secure fund management | TBD |
| **MultiSigApproval** | 3-wallet approval system | TBD |
| **CRIMEToken** | Platform native token | TBD |

## 🚀 Quick Start

### Prerequisites

- Node.js v16+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/proof-of-crime-contracts.git
cd proof-of-crime-contracts

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Add your private keys, RPC URLs, and API keys
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy Contracts

```bash
# Deploy to local Hardhat network
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Polygon Mumbai
npm run deploy:mumbai

# Deploy to BSC Testnet
npm run deploy:bsc-testnet
```

## 💼 Usage Examples

### For Companies (Bounty Creators)

```javascript
// 1. Approve USDT spending
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
await usdtContract.approve(BOUNTY_MANAGER_ADDRESS, ethers.parseUnits("150000", 6));

// 2. Create bounty
const bountyManager = new ethers.Contract(BOUNTY_MANAGER_ADDRESS, BOUNTY_ABI, signer);
await bountyManager.createBounty(
  "0x1234...contractAddress", // Target contract
  ethers.parseUnits("50000", 6), // 50k USDT reward pool
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days deadline
  USDT_ADDRESS
);
```

### For Bounty Hunters

```javascript
// 1. Register as hunter
await bountyManager.registerHunter();

// 2. Submit finding
await bountyManager.submitFinding(
  bountyId,
  "Reentrancy vulnerability in withdraw function...",
  "Proof of concept: ..."
);
```

### For Validators

```javascript
// 1. Cast validation vote
const validator = new ethers.Contract(VALIDATOR_ADDRESS, VALIDATOR_ABI, signer);
await validator.castVote(
  submissionId,
  2, // VulnerabilitySeverity.High
  true, // isValid
  "Confirmed critical reentrancy issue..."
);
```

## 💰 Business Model

### Revenue Streams

1. **Platform Fees**: 5% fee on all successful bounty payouts
2. **Subscription**: 2k USDT or staked CRIME tokens required
3. **Premium Features**: Boosted listings, private groups
4. **Tools**: Smart contract alerts, security extensions
5. **Validator Rewards**: Node operators earn from validation services

### Token Utility

- **Staking**: 12% APY for CRIME stakers
- **Governance**: DAO voting rights (Roadmap)
- **Subscriptions**: Access to platform features
- **Rewards**: Top contributors in DAO ChatFi

## 🔒 Security

### Audit Status

- ⏳ **Pending**: Professional security audit
- 🧪 **Testing**: Comprehensive test coverage in progress
- 🔐 **Multi-Sig**: All critical operations require multi-sig approval

### Security Features

- OpenZeppelin security libraries
- ReentrancyGuard on all financial functions
- Pausable emergency stops
- Multi-signature approvals for large transactions
- Role-based access control

## 🛠️ Development

### Project Structure

```
proof-of-crime-contracts/
├── contracts/
│   ├── BountyManager.sol
│   ├── VulnerabilityValidator.sol
│   ├── VaultManager.sol
│   ├── MultiSigApproval.sol
│   └── CRIMEToken.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── (test files)
├── deployments/
│   └── (deployment records)
├── hardhat.config.js
├── package.json
└── README.md
```

### Tech Stack

- **Solidity**: ^0.8.20
- **Hardhat**: Development environment
- **OpenZeppelin**: Security libraries
- **Ethers.js**: Web3 interactions
- **Chai**: Testing framework

## 📊 Contract Specifications

### BountyManager

**Key Functions:**
- `createBounty()`: Create new bounty with locked funds
- `submitFinding()`: Submit vulnerability report
- `validateSubmission()`: Process validator decision
- `payReward()`: Distribute rewards to hunters
- `completeBounty()`: Close bounty and return locked funds

### VulnerabilityValidator

**Key Functions:**
- `requestValidation()`: Initiate validation process
- `castVote()`: Validators vote on severity
- `getValidationStatus()`: Check validation progress

### VaultManager

**Key Functions:**
- `deposit()`: Deposit funds to vault
- `payoutReward()`: Pay hunter rewards
- `returnFunds()`: Return unused funds
- `emergencyWithdraw()`: Owner emergency function

### CRIMEToken

**Key Functions:**
- `stake()`: Stake CRIME for rewards
- `unstake()`: Unstake CRIME
- `claimRewards()`: Claim staking rewards
- `hasSubscription()`: Check subscription status

## 🌐 Supported Networks

- Ethereum (Mainnet, Sepolia)
- Polygon (Mainnet, Mumbai)
- BNB Smart Chain (Mainnet, Testnet)
- Arbitrum One
- Optimism
- Avalanche C-Chain

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Contact & Support

- **Website**: https://proofofcrime.io (TBD)
- **Twitter**: @ProofOfCrime (TBD)
- **Discord**: discord.gg/proofofcrime (TBD)
- **Email**: contact@proofofcrime.io (TBD)

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. Always perform due diligence and security audits before deploying to mainnet.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat team for excellent development tools
- Web3 security community for inspiration

---

**Built with ❤️ for a safer Web3 ecosystem**
