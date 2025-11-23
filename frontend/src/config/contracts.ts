// Contract Addresses
export const CONTRACT_ADDRESSES = {
  BountyManager: process.env.NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS as `0x${string}`,
  VaultManager: process.env.NEXT_PUBLIC_VAULT_MANAGER_ADDRESS as `0x${string}`,
  VulnerabilityValidator: process.env.NEXT_PUBLIC_VALIDATOR_ADDRESS as `0x${string}`,
  MultiSigApproval: process.env.NEXT_PUBLIC_MULTISIG_ADDRESS as `0x${string}`,
  CRIMEToken: process.env.NEXT_PUBLIC_CRIME_TOKEN_ADDRESS as `0x${string}`,
} as const;

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  wsURL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
  timeout: 30000,
} as const;

// Chain Configuration
export const CHAIN_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
  networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
} as const;

// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Proof of Crime',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Web3 Bounty & Crime Tracking Platform',
} as const;
