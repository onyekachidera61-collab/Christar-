const pool = require('../config/database');
const constants = require('../config/constants');

class WalletService {
  async getBalance(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT balance FROM wallets WHERE user_id = ?',
        [userId]
      );
      return rows[0]?.balance || 0;
    } catch (error) {
      throw error;
    }
  }

  async addFunds(userId, amount, type, description) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update wallet
      await connection.query(
        'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
        [amount, userId]
      );

      // Create transaction record
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)',
        [userId, type, amount, description, 'completed']
      );

      await connection.commit();
      return { success: true, message: 'Funds added successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deductFunds(userId, amount, type, description) {
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      return { success: false, message: 'Insufficient balance' };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update wallet
      await connection.query(
        'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
        [amount, userId]
      );

      // Create transaction record
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, description, status) VALUES (?, ?, ?, ?, ?)',
        [userId, type, amount, description, 'completed']
      );

      await connection.commit();
      return { success: true, message: 'Funds deducted successfully' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  calculateRewards(totalPool, playerCount, placement) {
    const platformFee = totalPool * constants.PLATFORM_FEE;
    const remainingPool = totalPool - platformFee;

    if (playerCount === 2) {
      return placement === 1 ? remainingPool : 0;
    }

    if (playerCount === 4) {
      if (placement === 1) return remainingPool * 0.6;
      if (placement === 2) return remainingPool * 0.4;
      return 0;
    }

    return 0;
  }
}

module.exports = new WalletService();
