# Proof of Crime - Frontend

Modern Next.js frontend application untuk Proof of Crime platform dengan Privy wallet integration.

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet Auth**: Privy SDK
- **Web3**: Wagmi + Viem
- **State Management**: Zustand + React Query
- **UI Components**: Custom components dengan Tailwind
- **Animations**: Framer Motion
- **Icons**: React Icons

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- Privy Account (https://privy.io)
- Backend API running (lihat backend/README.md)

### Installation

```bash
# Install dependencies
cd frontend
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local dengan konfigurasi Anda
```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Privy Configuration (dari https://dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY

# Contract Addresses (dari deployment)
NEXT_PUBLIC_BOUNTY_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_VAULT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_VALIDATOR_ADDRESS=0x...
NEXT_PUBLIC_MULTISIG_ADDRESS=0x...
NEXT_PUBLIC_CRIME_TOKEN_ADDRESS=0x...
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3001
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Homepage
│   │   ├── providers.tsx      # Privy & React Query providers
│   │   └── globals.css        # Global styles + Tailwind
│   │
│   ├── components/            # React components
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── BountyCard.tsx     # Bounty display card
│   │   ├── Footer.tsx         # Footer component
│   │   └── ...
│   │
│   ├── config/                # Configuration
│   │   ├── privy.ts          # Privy SDK config
│   │   └── contracts.ts      # Contract addresses
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useBounties.ts    # Bounty data hook
│   │   └── useContracts.ts   # Contract interaction hook
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts            # API client
│   │   └── contracts.ts      # Contract ABIs & helpers
│   │
│   └── types/                 # TypeScript types
│       └── index.ts
│
├── public/                    # Static assets
├── .env.example              # Environment template
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

## 🎨 Design System

### Color Palette

```css
/* Primary (Red) */
primary-500: #ef4444
primary-600: #dc2626
primary-700: #b91c1c

/* Dark Theme */
dark-50: #18181b (background)
dark-100: #27272a
dark-200: #3f3f46
dark-900: #fafafa (text)

/* Accent Colors */
accent-cyan: #06b6d4
accent-purple: #a855f7
accent-green: #10b981
accent-yellow: #f59e0b
```

### Custom Components

#### Cyber Button
```tsx
<button className="cyber-button">
  Click Me
</button>
```

#### Glass Card
```tsx
<div className="glass-card p-6">
  Content
</div>
```

#### Gradient Text
```tsx
<h1 className="gradient-text">
  Beautiful Gradient
</h1>
```

#### Badges
```tsx
<span className="badge-success">Active</span>
<span className="badge-danger">Critical</span>
<span className="badge-warning">Pending</span>
<span className="badge-info">Info</span>
```

## 🔌 Privy Integration

### Setup Privy

1. Buat account di https://privy.io
2. Create new app
3. Copy App ID
4. Tambahkan ke `.env.local` sebagai `NEXT_PUBLIC_PRIVY_APP_ID`

### Using Privy Hooks

```tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function MyComponent() {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <div>
      {authenticated ? (
        <div>
          <p>Welcome {user?.wallet?.address}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={login}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## 📡 API Integration

### Using API Client

```typescript
import { api } from '@/lib/api';

// GET bounties
const bounties = await api.get('/bounties');

// POST submission
const submission = await api.post('/submissions', {
  bountyId: 1,
  title: 'Found vulnerability',
  description: '...',
});

// With authentication
const profile = await api.get('/users/me', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### React Query Hooks

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBounties() {
  return useQuery({
    queryKey: ['bounties'],
    queryFn: async () => {
      const { data } = await api.get('/bounties');
      return data.data.bounties;
    },
  });
}

// Usage in component
function BountiesPage() {
  const { data: bounties, isLoading, error } = useBounties();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading bounties</div>;

  return (
    <div>
      {bounties.map(bounty => (
        <BountyCard key={bounty.id} bounty={bounty} />
      ))}
    </div>
  );
}
```

## 🔗 Contract Interactions

### Using Wagmi Hooks

```tsx
'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import BountyManagerABI from '@/lib/abis/BountyManager.json';

export function CreateBountyButton() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createBounty = async () => {
    writeContract({
      address: CONTRACT_ADDRESSES.BountyManager,
      abi: BountyManagerABI,
      functionName: 'createBounty',
      args: [
        '0x...', // target contract
        50000n * 10n ** 6n, // reward amount (50k USDT)
        BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // deadline
        '0x...', // USDT token address
      ],
    });
  };

  return (
    <button onClick={createBounty} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Bounty'}
    </button>
  );
}
```

## 🎯 Key Features

### 1. Wallet Authentication
- Multiple wallet support (MetaMask, WalletConnect, Coinbase Wallet)
- Email & social login via Privy
- Embedded wallets for users without crypto wallets

### 2. Bounty Management
- Browse active bounties
- Filter by category, status, reward
- Submit vulnerability findings
- Track submission status

### 3. Dashboard
- Personal statistics
- Earnings tracking
- Submission history
- Leaderboards

### 4. Real-time Updates
- WebSocket for live bounty updates
- Instant notifications
- Real-time validation status

### 5. CRIME Token
- View token balance
- Staking interface
- Rewards tracking
- Subscription management

## 🧪 Development

### Adding New Pages

```bash
# Create new route
mkdir -p src/app/my-page
touch src/app/my-page/page.tsx

# Add content
echo "'use client';

export default function MyPage() {
  return <div>My Page</div>;
}" > src/app/my-page/page.tsx
```

### Creating Components

```bash
# Create component
touch src/components/MyComponent.tsx
```

```tsx
// src/components/MyComponent.tsx
'use client';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );
}
```

### Custom Hooks

```typescript
// src/hooks/useMyHook.ts
import { useState, useEffect } from 'react';

export function useMyHook() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
  }, []);

  return { data };
}
```

## 🎨 Styling Guidelines

### Use Tailwind Classes
```tsx
<div className="flex items-center justify-between p-4 bg-dark-100 rounded-lg">
  Content
</div>
```

### Custom Classes (globals.css)
```tsx
<div className="cyber-button">Button</div>
<div className="glass-card">Card</div>
<h1 className="gradient-text">Text</h1>
```

### Responsive Design
```tsx
<div className="
  flex flex-col
  md:flex-row
  gap-4 md:gap-6
  p-4 md:p-8
">
  Responsive Content
</div>
```

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables in Vercel

Add all variables from `.env.example` in Vercel dashboard:
- Project Settings → Environment Variables
- Add each variable dengan values yang sesuai

### Build Command

```bash
npm run build
```

### Output Directory

```
.next
```

## 🔍 Troubleshooting

### Privy Connection Issues

```bash
# Clear cookies and cache
# Make sure NEXT_PUBLIC_PRIVY_APP_ID is correct
# Check Privy dashboard for allowed domains
```

### Contract Interaction Errors

```bash
# Verify contract addresses in .env.local
# Check network (should match backend)
# Ensure wallet has enough gas
```

### Build Errors

```bash
# Clear cache
rm -rf .next
npm run build
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io)
- [Wagmi Documentation](https://wagmi.sh)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Viem Documentation](https://viem.sh)

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

**Built with ❤️ using Next.js & Privy**
