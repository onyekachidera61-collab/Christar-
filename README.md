# Ludo Game - Production Ready Multiplayer Platform

## Overview
A complete, production-ready multiplayer Ludo game platform similar to Ludo Naira, built with Node.js, Express, Socket.IO, and MySQL. Features real-time multiplayer gameplay, wallet system, tournaments, and admin management.

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript, Socket.IO Client
- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **Database**: MySQL
- **Authentication**: JWT
- **Mobile**: Fully responsive design

## Features

### Core Gameplay
- ✅ Real Ludo rules implementation
- ✅ 2-player and 4-player modes
- ✅ Dice rolling with animations
- ✅ Token movement animation
- ✅ Safe cells, home path, token killing
- ✅ Turn timer with auto-skip
- ✅ Winning detection and ranking

### Match Types
- ✅ Free Match (public/private rooms)
- ✅ Money Match with entry fees
- ✅ Tournament system

### Wallet & Payment
- ✅ Wallet balance management
- ✅ Deposit/Withdrawal history
- ✅ Transaction logging
- ✅ Automatic wallet updates post-game

### Real-time Features
- ✅ Live matchmaking
- ✅ Online player count
- ✅ Friend system
- ✅ Match invitations
- ✅ In-game chat
- ✅ Notifications

### Admin Panel
- ✅ User management
- ✅ Wallet management
- ✅ Tournament management
- ✅ Revenue analytics
- ✅ Withdrawal approvals

### Security
- ✅ Server-side move validation
- ✅ Anti-cheat protection
- ✅ Secure socket events
- ✅ Rate limiting

## Quick Start

### Prerequisites
- Node.js >= 14.0
- MySQL >= 5.7
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ludo-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## Project Structure

```
ludo-game/
├── client/                 # Frontend files
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── js/
│   │   ├── main.js
│   │   ├── game.js
│   │   ├── socket-client.js
│   │   ├── auth.js
│   │   └── utils.js
│   └── assets/
│       ├── images/
│       └── sounds/
│
├── server/                 # Backend files
│   ├── index.js
│   ├── config/
│   │   ├── database.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── wallet.js
│   │   ├── match.js
│   │   ├── tournament.js
│   │   ├── user.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── walletController.js
│   │   ├── matchController.js
│   │   ├── tournamentController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Wallet.js
│   │   ├── Match.js
│   │   ├── Tournament.js
│   │   └── Transaction.js
│   ├── services/
│   │   ├── ludoEngine.js
│   │   ├── matchmakingService.js
│   │   ├── walletService.js
│   │   └── antiCheatService.js
│   ├── sockets/
│   │   ├── gameSocket.js
│   │   ├── matchSocket.js
│   │   └── notificationSocket.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validator.js
│   │   └── logger.js
│   └── scripts/
│       └── migrate.js
│
├── database/
│   └── schema.sql
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

## API Documentation

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
POST /api/auth/refresh - Refresh JWT token
GET /api/auth/profile - Get user profile
```

### Wallet
```
GET /api/wallet/balance - Get wallet balance
GET /api/wallet/transactions - Get transaction history
POST /api/wallet/deposit - Deposit funds
POST /api/wallet/withdraw - Request withdrawal
```

### Matches
```
GET /api/matches - List available matches
POST /api/matches/create - Create match
GET /api/matches/:id - Get match details
POST /api/matches/:id/join - Join match
```

### Tournament
```
GET /api/tournaments - List tournaments
GET /api/tournaments/:id - Get tournament details
POST /api/tournaments/:id/join - Join tournament
```

### Admin
```
GET /api/admin/dashboard - Dashboard statistics
GET /api/admin/users - Manage users
GET /api/admin/withdrawals - Manage withdrawals
POST /api/admin/withdrawals/:id/approve - Approve withdrawal
```

## Database Schema

See `database/schema.sql` for complete schema.

### Core Tables
- `users` - User accounts
- `wallets` - User wallet balances
- `transactions` - Wallet transactions
- `matches` - Game matches
- `match_players` - Match participants
- `tournaments` - Tournament info
- `tournament_players` - Tournament participants
- `rewards` - Reward distribution
- `notifications` - User notifications
- `friendships` - Friend connections
- `messages` - In-game chat messages

## Socket.IO Events

### Game Events
```javascript
// Client -> Server
'game:join' - Join game room
'game:roll-dice' - Roll dice
'game:move-token' - Move token
'game:skip-turn' - Skip turn

// Server -> Client
'game:state-update' - Game state update
'game:dice-result' - Dice roll result
'game:turn-change' - Turn changed
'game:game-over' - Game finished
```

## Reward Distribution

### 2-Player Match
- Platform Fee: 20%
- Winner: 80% of remaining pool

### 4-Player Match
- Platform Fee: 20%
- 1st Place: 60% of remaining pool
- 2nd Place: 40% of remaining pool
- 3rd Place: 0%
- 4th Place: 0%

### Tournament
- Platform Fee: 30%
- Winners share remaining 70% based on ranks

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
1. Install Node.js and MySQL
2. Clone repository
3. Install dependencies: `npm install`
4. Configure `.env` file
5. Setup database: `npm run migrate`
6. Start server: `npm start`

## Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Server-side move validation
- ✅ Anti-cheat detection
- ✅ Rate limiting
- ✅ SQL injection prevention
- ✅ CORS protection
- ✅ Helmet.js security headers

## Performance Optimization

- Database connection pooling
- Redis caching (optional)
- Socket.IO namespace separation
- Request compression
- Asset minification

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

MIT

## Support

For support, email support@ludogame.com
