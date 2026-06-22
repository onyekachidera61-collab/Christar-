module.exports = {
  GAME_STATUS: {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  MATCH_TYPE: {
    FREE: 'free',
    MONEY: 'money',
    TOURNAMENT: 'tournament'
  },
  
  PLAYER_STATUS: {
    ACTIVE: 'active',
    OUT: 'out',
    WINNER: 'winner'
  },
  
  TRANSACTION_TYPE: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    MATCH_FEE: 'match_fee',
    REWARD: 'reward',
    REFUND: 'refund'
  },
  
  BOARD_SIZE: 52,
  HOME_STRETCH: 6,
  SAFE_CELLS: [0, 9, 14, 22, 27, 35, 40, 48],
  TOKEN_START_POSITIONS: {
    0: [0, 1, 2, 3],
    1: [13, 14, 15, 16],
    2: [26, 27, 28, 29],
    3: [39, 40, 41, 42]
  },
  
  PLATFORM_FEE: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 0.20,
  TOURNAMENT_FEE: parseFloat(process.env.TOURNAMENT_FEE_PERCENTAGE) || 0.30,
  
  TURN_TIMER: 30000, // 30 seconds
  DICE_ANIMATION_TIME: 1000 // 1 second
};
