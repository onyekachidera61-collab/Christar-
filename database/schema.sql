-- Ludo Game Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  role ENUM('user', 'admin') DEFAULT 'user',
  status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('deposit', 'withdrawal', 'match_fee', 'reward', 'refund') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  reference_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  bank_details JSON,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id VARCHAR(255) UNIQUE NOT NULL,
  created_by INT NOT NULL,
  type ENUM('free', 'money', 'tournament') DEFAULT 'free',
  player_count INT DEFAULT 2,
  entry_fee DECIMAL(15, 2) DEFAULT 0,
  prize_pool DECIMAL(15, 2) DEFAULT 0,
  platform_fee DECIMAL(15, 2) DEFAULT 0,
  winner_id INT,
  is_private BOOLEAN DEFAULT FALSE,
  room_code VARCHAR(20),
  status ENUM('waiting', 'in_progress', 'completed', 'cancelled') DEFAULT 'waiting',
  game_data LONGTEXT,
  duration_seconds INT,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (winner_id) REFERENCES users(id),
  INDEX idx_match_id (match_id),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by),
  INDEX idx_created_at (created_at)
);

-- Match Players table
CREATE TABLE IF NOT EXISTS match_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  ranking INT,
  status ENUM('waiting', 'playing', 'won', 'lost', 'quit') DEFAULT 'waiting',
  score INT DEFAULT 0,
  reward DECIMAL(15, 2) DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_match_player (match_id, user_id),
  INDEX idx_match_id (match_id),
  INDEX idx_user_id (user_id)
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id VARCHAR(255) UNIQUE NOT NULL,
  created_by INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game_type ENUM('2-player', '4-player') DEFAULT '4-player',
  entry_fee DECIMAL(15, 2) DEFAULT 0,
  max_players INT DEFAULT 100,
  current_players INT DEFAULT 0,
  prize_pool DECIMAL(15, 2) DEFAULT 0,
  platform_fee DECIMAL(15, 2) DEFAULT 0,
  status ENUM('waiting', 'in_progress', 'completed', 'cancelled') DEFAULT 'waiting',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_tournament_id (tournament_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Tournament Players table
CREATE TABLE IF NOT EXISTS tournament_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tournament_id VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  ranking INT,
  status ENUM('active', 'eliminated', 'winner') DEFAULT 'active',
  reward DECIMAL(15, 2) DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_tournament_player (tournament_id, user_id),
  INDEX idx_tournament_id (tournament_id),
  INDEX idx_user_id (user_id),
  INDEX idx_ranking (ranking)
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id VARCHAR(255),
  tournament_id VARCHAR(255),
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  ranking INT,
  reward_type ENUM('match_win', 'tournament_prize', 'bonus') DEFAULT 'match_win',
  status ENUM('pending', 'distributed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  from_user_id INT,
  type ENUM('friend_request', 'match_invitation', 'game_update', 'reward', 'system') DEFAULT 'system',
  title VARCHAR(255),
  message TEXT,
  reference_id VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (user_id, friend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_friend_id (friend_id),
  INDEX idx_status (status)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id VARCHAR(255),
  from_user_id INT NOT NULL,
  to_user_id INT,
  message TEXT NOT NULL,
  message_type ENUM('in_game', 'private', 'system') DEFAULT 'in_game',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id),
  INDEX idx_match_id (match_id),
  INDEX idx_from_user_id (from_user_id),
  INDEX idx_created_at (created_at)
);

-- Create initial admin user
INSERT IGNORE INTO users (username, email, password, role) 
VALUES ('admin', 'admin@ludogame.com', '$2a$10$kI6h3e5SyqZsXQXKEzH8ce7Jh1LDnPJiNOFzLe1lE9F6P5zLfLSUa', 'admin');

-- Create wallet for admin
INSERT IGNORE INTO wallets (user_id, balance) 
SELECT id, 0 FROM users WHERE email = 'admin@ludogame.com';
