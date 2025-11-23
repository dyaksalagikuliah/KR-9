import { PrivyClientConfig } from '@privy-io/react-auth';
import { sepolia, mainnet, polygon, bsc } from 'viem/chains';

export const privyConfig: PrivyClientConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  config: {
    loginMethods: ['wallet', 'email', 'google'],
    appearance: {
      theme: 'dark',
      accentColor: '#dc2626',
      logo: '/logo.png',
      showWalletLoginFirst: true,
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
    },
    defaultChain: sepolia,
    supportedChains: [sepolia, mainnet, polygon, bsc],
  },
};

export const chains = [sepolia, mainnet, polygon, bsc] as const;

export const defaultChain = sepolia;
