/**
 * Smart Contract Addresses
 * Update these after deployment
 */

const CONTRACT_ADDRESSES = {
  // Mainnet
  mainnet: {
    BountyManager: process.env.BOUNTY_MANAGER_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
    VaultManager: process.env.VAULT_MANAGER_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
    VulnerabilityValidator: process.env.VALIDATOR_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
    MultiSigApproval: process.env.MULTISIG_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
    CRIMEToken: process.env.CRIME_TOKEN_ADDRESS_MAINNET || '0x0000000000000000000000000000000000000000',
  },

  // Sepolia Testnet
  sepolia: {
    BountyManager: process.env.BOUNTY_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000',
    VaultManager: process.env.VAULT_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000',
    VulnerabilityValidator: process.env.VALIDATOR_ADDRESS || '0x0000000000000000000000000000000000000000',
    MultiSigApproval: process.env.MULTISIG_ADDRESS || '0x0000000000000000000000000000000000000000',
    CRIMEToken: process.env.CRIME_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  },

  // Polygon
  polygon: {
    BountyManager: process.env.BOUNTY_MANAGER_ADDRESS_POLYGON || '0x0000000000000000000000000000000000000000',
    VaultManager: process.env.VAULT_MANAGER_ADDRESS_POLYGON || '0x0000000000000000000000000000000000000000',
    VulnerabilityValidator: process.env.VALIDATOR_ADDRESS_POLYGON || '0x0000000000000000000000000000000000000000',
    MultiSigApproval: process.env.MULTISIG_ADDRESS_POLYGON || '0x0000000000000000000000000000000000000000',
    CRIMEToken: process.env.CRIME_TOKEN_ADDRESS_POLYGON || '0x0000000000000000000000000000000000000000',
  },

  // BSC
  bsc: {
    BountyManager: process.env.BOUNTY_MANAGER_ADDRESS_BSC || '0x0000000000000000000000000000000000000000',
    VaultManager: process.env.VAULT_MANAGER_ADDRESS_BSC || '0x0000000000000000000000000000000000000000',
    VulnerabilityValidator: process.env.VALIDATOR_ADDRESS_BSC || '0x0000000000000000000000000000000000000000',
    MultiSigApproval: process.env.MULTISIG_ADDRESS_BSC || '0x0000000000000000000000000000000000000000',
    CRIMEToken: process.env.CRIME_TOKEN_ADDRESS_BSC || '0x0000000000000000000000000000000000000000',
  },

  // Localhost / Hardhat
  localhost: {
    BountyManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    VaultManager: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    VulnerabilityValidator: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    MultiSigApproval: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    CRIMEToken: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  },
};

/**
 * Get contract address for current network
 */
function getContractAddress(contractName, network = null) {
  const currentNetwork = network || process.env.NETWORK || 'sepolia';

  if (!CONTRACT_ADDRESSES[currentNetwork]) {
    throw new Error(`Network ${currentNetwork} not supported`);
  }

  const address = CONTRACT_ADDRESSES[currentNetwork][contractName];

  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`⚠️  ${contractName} address not set for ${currentNetwork}`);
  }

  return address;
}

/**
 * Get all addresses for current network
 */
function getAllAddresses(network = null) {
  const currentNetwork = network || process.env.NETWORK || 'sepolia';
  return CONTRACT_ADDRESSES[currentNetwork] || {};
}

/**
 * Check if all contracts are deployed
 */
function areContractsDeployed(network = null) {
  const addresses = getAllAddresses(network);
  return Object.values(addresses).every(
    addr => addr && addr !== '0x0000000000000000000000000000000000000000'
  );
}

module.exports = {
  CONTRACT_ADDRESSES,
  getContractAddress,
  getAllAddresses,
  areContractsDeployed,
};
