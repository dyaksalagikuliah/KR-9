# Proof of Crime - Backend API

Backend sistem untuk Proof of Crime Platform dengan blockchain indexing, authentication, dan REST API.

## 🏗️ Arsitektur

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Express    │────▶│  PostgreSQL  │     │  Blockchain │
│  API Server │     │   Database   │◀────│   Indexer   │
└──────┬──────┘     └──────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│    Cache    │
└─────────────┘
```

## 📋 Prerequisites

- Node.js >= 16.0.0
- PostgreSQL >= 13
- Redis >= 6.0
- npm atau yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dan isi dengan konfigurasi Anda:
- Database credentials
- JWT secrets
- Blockchain RPC URLs
- Contract addresses (setelah deployment)

### 3. Setup Database

```bash
# Create database
createdb proof_of_crime

# Run migrations
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Start Blockchain Indexer (Terminal Terpisah)

```bash
npm run indexer
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Konfigurasi (database, redis)
│   │   ├── database.js
│   │   └── redis.js
│   │
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── bountyController.js
│   │   └── ...
│   │
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── bountyRoutes.js
│   │   └── ...
│   │
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── ...
│   │
│   ├── services/         # External services
│   │   ├── indexer.js    # Blockchain event indexer
│   │   ├── ipfs.js       # IPFS integration
│   │   └── notification.js
│   │
│   ├── database/         # Database files
│   │   ├── schema.sql
│   │   └── migrate.js
│   │
│   ├── utils/            # Utility functions
│   │
│   └── server.js         # Main server file
│
├── .env.example          # Environment template
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication

```
GET    /api/v1/auth/nonce/:walletAddress  - Get nonce untuk signature
POST   /api/v1/auth/login                 - Login dengan wallet
POST   /api/v1/auth/refresh               - Refresh access token
POST   /api/v1/auth/logout                - Logout
GET    /api/v1/auth/me                    - Get current user
```

### Bounties

```
GET    /api/v1/bounties                   - List bounties
GET    /api/v1/bounties/:id               - Get bounty detail
GET    /api/v1/bounties/:id/submissions   - Get bounty submissions
GET    /api/v1/bounties/:id/stats         - Get bounty statistics
POST   /api/v1/bounties                   - Create bounty (Company)
PUT    /api/v1/bounties/:id               - Update bounty (Owner)
```

### Submissions

```
GET    /api/v1/submissions                - List submissions
POST   /api/v1/submissions                - Create submission
GET    /api/v1/submissions/:id            - Get submission detail
PUT    /api/v1/submissions/:id            - Update submission
```

### Users

```
GET    /api/v1/users/:address             - Get user profile
PUT    /api/v1/users/profile              - Update profile
```

## 🔐 Authentication Flow

### 1. Get Nonce

```javascript
GET /api/v1/auth/nonce/0x1234...

Response:
{
  "success": true,
  "data": {
    "message": "Sign this message to authenticate...\n\nNonce: 123456\nTimestamp: 1234567890",
    "nonce": "123456",
    "timestamp": 1234567890
  }
}
```

### 2. Sign Message dengan MetaMask

```javascript
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, walletAddress],
});
```

### 3. Login

```javascript
POST /api/v1/auth/login
{
  "walletAddress": "0x1234...",
  "signature": "0xabcd...",
  "message": "Sign this message..."
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 4. Use Access Token

```javascript
fetch('/api/v1/bounties', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## 📊 Database Schema

### Users Table
- Menyimpan data user (wallet, profile, role)
- Roles: hunter, company, validator, admin

### Bounties Table
- Data bounty lengkap (on-chain + off-chain)
- Linked ke company user
- Status tracking

### Submissions Table
- Vulnerability submissions
- Linked ke bounty dan hunter
- Severity dan reward tracking

### Hunter Stats Table
- Aggregated statistics
- Total earned, submissions, reputation

## 🔄 Blockchain Indexer

Indexer mendengarkan events dari smart contract dan sync ke database.

### Events yang Diindex:

1. **BountyCreated** - Bounty baru dibuat
2. **SubmissionCreated** - Submission baru
3. **SubmissionValidated** - Submission divalidasi
4. **RewardPaid** - Reward dibayar
5. **BountyCompleted** - Bounty selesai

### Cara Kerja:

```javascript
// 1. Historical Indexing (catch up)
await indexer.indexHistoricalEvents(fromBlock, toBlock);

// 2. Real-time Listening
bountyManager.on('BountyCreated', async (event) => {
  await handleBountyCreated(event);
});
```

### Run Indexer:

```bash
npm run indexer
```

Indexer akan:
1. Connect ke blockchain via WebSocket
2. Index historical events dari last block
3. Listen real-time events
4. Update database otomatis

## 💾 Caching Strategy

Redis digunakan untuk:

### 1. Session Management
```javascript
// Store nonce untuk authentication
cache.set(`nonce:${address}`, data, 300); // 5 min
```

### 2. API Response Caching
```javascript
// Cache bounty list
cache.set('bounties:active', data, 300); // 5 min
```

### 3. Rate Limiting
```javascript
// Track request count per IP
cache.incr(`ratelimit:${ip}`);
```

## 🌐 WebSocket Events

Real-time updates via Socket.IO:

### Client-side:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join bounty room
socket.emit('join_bounty', bountyId);

// Listen for updates
socket.on('submission_update', (data) => {
  console.log('New submission:', data);
});

// Leave room
socket.emit('leave_bounty', bountyId);
```

### Server-side Emit:

```javascript
// Emit ke specific bounty room
io.to(`bounty_${bountyId}`).emit('submission_update', data);

// Emit ke all connected clients
io.emit('platform_stats_update', stats);
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📝 Environment Variables

### Required:
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/proof_of_crime
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proof_of_crime
DB_USER=postgres
DB_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Blockchain
ETHEREUM_RPC_URL=https://...
ETHEREUM_WS_URL=wss://...
BOUNTY_MANAGER_ADDRESS=0x...
```

## 🚢 Deployment

### Production Build:

```bash
# Set environment
export NODE_ENV=production

# Install dependencies
npm install --production

# Run migrations
npm run migrate

# Start server
npm start

# Start indexer (separate process)
npm run indexer
```

### Using PM2:

```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start src/server.js --name "proof-of-crime-api"

# Start indexer
pm2 start src/services/indexer.js --name "proof-of-crime-indexer"

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

### Docker (Coming Soon):

```bash
docker-compose up -d
```

## 🔧 Common Tasks

### Reset Database:

```bash
# Drop and recreate
dropdb proof_of_crime
createdb proof_of_crime
npm run migrate
```

### Clear Redis Cache:

```bash
redis-cli FLUSHALL
```

### Reindex Blockchain:

```bash
# Update INDEXER_START_BLOCK in .env
# Then restart indexer
npm run indexer
```

## 🐛 Troubleshooting

### Database Connection Error:

```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
```

### Redis Connection Error:

```bash
# Check Redis is running
redis-cli ping

# Should return PONG
```

### Indexer Not Syncing:

```bash
# Check RPC URL is correct
# Check contract address is deployed
# Check network matches (mainnet/testnet)
# Check starting block number
```

## 📈 Monitoring

### Health Check:

```bash
curl http://localhost:3000/health
```

### Database Stats:

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Stats:

```bash
redis-cli INFO stats
```

## 🛡️ Security

### Best Practices:

1. **Environment Variables**: Jangan commit `.env` ke git
2. **JWT Secrets**: Gunakan strong random strings
3. **Rate Limiting**: Enabled untuk semua endpoints
4. **CORS**: Configure dengan benar untuk production
5. **Helmet.js**: Enabled untuk security headers
6. **Input Validation**: Semua input divalidasi dengan express-validator
7. **SQL Injection**: Menggunakan parameterized queries
8. **XSS Protection**: Input sanitization

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for Proof of Crime Platform**
