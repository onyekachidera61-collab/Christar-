# Ludo Game - Installation & Deployment Guide

## Quick Start

### Prerequisites
- Node.js >= 14.0
- MySQL >= 5.7
- npm or yarn

### Local Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/9jaWin/ludo-game.git
   cd ludo-game
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ludo_game
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Setup Database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Start Server**
   ```bash
   npm start
   ```
   
   For development with hot reload:
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health

## Docker Deployment

### Quick Start with Docker

1. **Build and Run**
   ```bash
   docker-compose up -d
   ```

2. **Stop Containers**
   ```bash
   docker-compose down
   ```

3. **View Logs**
   ```bash
   docker-compose logs -f app
   ```

## Production Deployment

### Server Requirements
- Ubuntu 20.04 LTS or higher
- 2GB RAM minimum
- 20GB disk space
- 2GB bandwidth

### Installation on VPS

1. **SSH into Server**
   ```bash
   ssh root@your_server_ip
   ```

2. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Dependencies**
   ```bash
   apt install -y curl git nodejs npm mysql-server nginx
   ```

4. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/9jaWin/ludo-game.git
   cd ludo-game
   ```

5. **Install Node Packages**
   ```bash
   npm install --production
   ```

6. **Setup Database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

7. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit configuration
   ```

8. **Setup Nginx Reverse Proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Setup PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "ludo-game"
   pm2 startup
   pm2 save
   ```

10. **Setup SSL (Let's Encrypt)**
    ```bash
    apt install -y certbot python3-certbot-nginx
    certbot --nginx -d your_domain.com
    ```

11. **Restart Services**
    ```bash
    systemctl restart nginx
    ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/deposit` - Deposit funds
- `POST /api/wallet/withdraw` - Withdraw funds

### Matches
- `GET /api/match/available` - List available matches
- `POST /api/match/create` - Create match
- `POST /api/match/:matchId/join` - Join match

### Tournament
- `GET /api/tournament` - List tournaments
- `GET /api/tournament/:id` - Get tournament details
- `POST /api/tournament/:id/join` - Join tournament

### User
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get user stats
- `GET /api/user/leaderboard` - Get leaderboard

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/withdrawals` - Pending withdrawals
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal

## Socket.IO Events

### Game Namespace: `/game`
- `game:find-match` - Find match
- `game:join-match` - Join match
- `game:roll-dice` - Roll dice
- `game:move-token` - Move token
- `game:skip-turn` - Skip turn
- `game:match-found` - Match found (server)
- `game:dice-rolled` - Dice rolled (server)
- `game:state-updated` - Game state updated (server)
- `game:ended` - Game ended (server)

### Notification Namespace: `/notifications`
- `notification:send` - Send notification
- `friend:request` - Send friend request
- `friend:accept` - Accept friend request

## Database Backup

```bash
# Backup
mysqldump -u root -p ludo_game > backup.sql

# Restore
mysql -u root -p ludo_game < backup.sql
```

## Monitoring

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

### View Logs
```bash
pm2 logs ludo-game
```

## Troubleshooting

### Database Connection Error
- Check MySQL is running: `systemctl status mysql`
- Verify credentials in `.env`
- Check MySQL port 3306 is open

### Port Already in Use
```bash
lsof -i :3000
kill -9 PID
```

### Socket.IO Connection Issues
- Check CORS settings in `server/index.js`
- Verify Socket.IO server is running
- Check client-side authentication token

## Support

For issues, please create a GitHub issue or contact support@ludogame.com
