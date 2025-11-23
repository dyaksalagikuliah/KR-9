# Proof of Crime - System Architecture

## Overview

This document describes the technical architecture of the Proof of Crime smart contract bounty platform.

## System Components

### 1. BountyManager Contract

**Purpose**: Central orchestrator for the entire bounty lifecycle.

**Key Responsibilities**:
- Bounty creation with company fund locking (100k USDT)
- Hunter registration and management
- Vulnerability submission handling
- Integration with validator and vault systems
- Bounty completion and cancellation

**State Management**:
```solidity
struct Bounty {
    uint256 id;
    address company;
    string targetContract;
    uint256 totalReward;
    uint256 remainingReward;
    uint256 lockAmount; // 100k USDT
    BountyStatus status;
    uint256 createdAt;
    uint256 deadline;
    bool isActive;
    address paymentToken;
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
```

**Flow**:
1. Company creates bounty → locks 100k USDT + reward pool
2. Hunters submit findings
3. Submissions forwarded to validators
4. Valid submissions trigger reward payout
5. Bounty completion returns locked funds

### 2. VulnerabilityValidator Contract

**Purpose**: Decentralized validation of vulnerability submissions.

**Key Features**:
- Multi-validator consensus mechanism
- Severity assessment (Low, Medium, High)
- Validator reputation system
- Transparent voting process

**Validation Flow**:
```
Submission → Request Validation → Multiple Validators Vote →
Consensus Reached → Severity Determined → Callback to BountyManager
```

**Validator Reputation**:
- Validators earn reputation for accurate assessments
- Mismatched votes reduce reputation
- High reputation validators may get priority/weight (future)

**Configuration**:
- Minimum validators required: 3 (configurable)
- Voting mechanism: Majority consensus
- Severity determination: Highest severity with majority

### 3. VaultManager Contract

**Purpose**: Secure custody and distribution of funds.

**Security Features**:
- Isolated fund storage
- Multi-sig approval for large withdrawals
- Emergency withdrawal mechanism
- Comprehensive balance tracking

**Fund Flow**:
```
Company → VaultManager (deposit)
VaultManager → Hunter (reward payout)
VaultManager → Platform (fee collection)
VaultManager → Company (return unused funds)
```

**Balance Tracking**:
```solidity
struct VaultBalance {
    uint256 totalDeposited;
    uint256 totalWithdrawn;
    uint256 availableBalance;
}
```

### 4. MultiSigApproval Contract

**Purpose**: Three-wallet approval system for critical operations.

**Wallet Roles**:
- **Wallet 1**: Company/Corporate entities
- **Wallet 2**: DApp platform operators
- **Wallet 3**: Professional validators/auditors

**Approval Requirements**:
- All 3 wallets must approve for vault opening
- Prevents unilateral fund access
- Transparent approval tracking

**Request Types**:
- `OPEN_VAULT`: Open vault for reward distribution
- `VALIDATE_SUBMISSION`: Override validation decisions
- `EMERGENCY_WITHDRAW`: Emergency fund recovery
- Custom types can be added

**Approval Process**:
```
1. Request created → ApprovalRequested event
2. Wallet 1 approves → ApprovalGranted event
3. Wallet 2 approves → ApprovalGranted event
4. Wallet 3 approves → ApprovalGranted event
5. Auto-execute → ApprovalExecuted event
```

### 5. CRIMEToken Contract

**Purpose**: Platform native token with utility and governance.

**Features**:
- ERC20 standard compliance
- Staking mechanism (12% APY)
- Subscription requirements
- Burnable and pausable
- Governance rights (roadmap)

**Tokenomics**:
- Max Supply: 1,000,000,000 CRIME
- Staking APY: 12%
- Minimum Stake: 1,000 CRIME
- Subscription: 2,000 USDT equivalent or staked CRIME

**Staking Mechanics**:
```solidity
stake() → Lock tokens → Earn rewards
unstake() → Unlock tokens → Claim pending rewards
claimRewards() → Calculate time-based rewards → Transfer to user
```

## Data Flow Diagrams

### Bounty Creation Flow

```
┌─────────────┐
│   Company   │
└──────┬──────┘
       │
       │ 1. Approve USDT (150k)
       ▼
┌─────────────────┐
│  BountyManager  │
└──────┬──────────┘
       │
       │ 2. Lock 100k USDT
       │ 3. Transfer 50k to Vault
       ▼
┌─────────────────┐
│  VaultManager   │
└─────────────────┘
```

### Submission & Validation Flow

```
┌──────────┐
│  Hunter  │
└────┬─────┘
     │
     │ 1. submitFinding()
     ▼
┌─────────────────┐
│ BountyManager   │
└────┬────────────┘
     │
     │ 2. Request validation
     ▼
┌──────────────────────┐
│ VulnerabilityValidator│
└────┬─────────────────┘
     │
     │ 3. Validators vote
     │ 4. Consensus reached
     ▼
┌─────────────────┐
│ BountyManager   │◄── 5. Callback with result
└────┬────────────┘
     │
     │ 6. payReward() if valid
     ▼
┌─────────────────┐
│ VaultManager    │──► 7. Transfer funds
└─────────────────┘      to hunter
```

### Multi-Sig Approval Flow

```
┌─────────────┐
│  Requester  │
└──────┬──────┘
       │
       │ 1. requestApproval()
       ▼
┌──────────────────┐
│ MultiSigApproval │
└────┬─────────────┘
     │
     ├──► Wallet 1 (approve)
     ├──► Wallet 2 (approve)
     └──► Wallet 3 (approve)
          │
          │ All approved?
          ▼
     ┌─────────┐
     │ Execute │
     └─────────┘
```

## Security Considerations

### 1. Reentrancy Protection
- All financial functions use `ReentrancyGuard`
- Checks-Effects-Interactions pattern followed
- State updates before external calls

### 2. Access Control
- Role-based permissions (OpenZeppelin AccessControl)
- Owner privileges limited and documented
- Multi-sig required for critical operations

### 3. Fund Security
- Isolated vault storage
- Lock mechanism for company commitment
- Emergency pause functionality
- Multi-sig approvals for large amounts

### 4. Integer Overflow Protection
- Solidity 0.8.20 has built-in overflow checks
- SafeERC20 used for token transfers
- Explicit validation of amounts

### 5. Front-Running Protection
- Submission details can be hashed initially
- Reveal phase for sensitive data
- Time-locked operations where applicable

## Gas Optimization

### Storage Optimization
- Packed structs where possible
- Mappings over arrays for lookups
- Events for historical data instead of storage

### Function Optimization
- View functions for read operations
- Batch operations where applicable
- Minimal storage writes

### Deployment Optimization
- Compiler optimization enabled (200 runs)
- Minimal contract size
- Proxy pattern for upgrades (future)

## Upgrade Strategy

### Current Approach
- Immutable contracts (v1.0)
- New features via new contract deployments
- Backward compatibility maintained

### Future Approach (Roadmap)
- Transparent proxy pattern
- Timelock for upgrades
- Community governance for changes
- Emergency pause for critical bugs

## Integration Points

### External Systems

1. **USDT Contract**
   - Interface: IERC20
   - Used for: Bounty payments, company locks
   - Networks: All supported EVM chains

2. **Oracle (Future)**
   - Purpose: Price feeds for CRIME/USDT
   - Provider: Chainlink
   - Use case: Dynamic subscription calculations

3. **WorldApp (Roadmap)**
   - Purpose: Biometric verification
   - Integration: API + on-chain verification
   - Use case: Criminal identity tracking

### Frontend Integration

```javascript
// Example: Create Bounty
const tx = await bountyManager.createBounty(
  targetContract,
  rewardAmount,
  deadline,
  usdtAddress
);

// Listen for events
bountyManager.on("BountyCreated", (bountyId, company, reward) => {
  console.log(`Bounty ${bountyId} created with ${reward} reward`);
});
```

## Testing Strategy

### Unit Tests
- Individual contract function testing
- Edge case coverage
- Revert condition testing

### Integration Tests
- Multi-contract interaction testing
- Full flow testing (creation → submission → validation → payout)
- Event emission verification

### Security Tests
- Reentrancy attack simulations
- Access control breach attempts
- Integer overflow/underflow tests
- Front-running scenarios

### Performance Tests
- Gas consumption analysis
- Large-scale operation testing
- Concurrent transaction handling

## Deployment Strategy

### Pre-Deployment
1. Security audit completion
2. Testnet deployment and testing
3. Community testing period
4. Bug bounty program

### Deployment Sequence
1. Deploy CRIMEToken
2. Deploy VaultManager
3. Deploy MultiSigApproval
4. Deploy VulnerabilityValidator
5. Deploy BountyManager
6. Configure contracts (set addresses)
7. Verify contracts on explorers
8. Transfer ownership to multi-sig

### Post-Deployment
1. Monitor for 24 hours
2. Gradual feature rollout
3. Community onboarding
4. Documentation updates

## Monitoring & Maintenance

### On-Chain Monitoring
- Event logs for all transactions
- Balance tracking in VaultManager
- Validator activity monitoring
- Failed transaction analysis

### Off-Chain Monitoring
- Gas price tracking
- Network health checks
- User activity analytics
- Security alert systems

### Maintenance Windows
- No downtime required (pausable)
- Emergency pause capability
- Hot-fix deployment process
- Communication protocol for issues

## Future Enhancements

### Short-Term (3-6 months)
- Advanced validator reputation system
- Dispute resolution mechanism
- Automated severity classification (AI-assisted)
- Mobile app integration

### Medium-Term (6-12 months)
- Criminal record tracking on-chain
- DAO governance implementation
- ChatFi social features
- Advanced analytics dashboard

### Long-Term (12+ months)
- Cross-chain bounty support
- ZK-proof for private submissions
- Decentralized storage (IPFS/Arweave)
- Validator node network
- Global API for criminal records

## Performance Metrics

### Target Metrics
- Bounty creation: < 100k gas
- Submission: < 80k gas
- Validation vote: < 60k gas
- Reward payout: < 120k gas

### Current Metrics
- TBD after deployment and gas profiling

## Conclusion

The Proof of Crime platform architecture is designed for:
- **Security**: Multi-layered security with multi-sig approvals
- **Scalability**: Efficient gas usage and modular design
- **Transparency**: On-chain validation and tracking
- **Decentralization**: Community-driven validation
- **Extensibility**: Ready for future enhancements

---

**Last Updated**: 2025-11-23
**Version**: 1.0.0
