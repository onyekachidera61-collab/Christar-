class MatchmakingService {
  constructor() {
    this.waitingPlayers = {
      '2-player': [],
      '4-player': []
    };
    this.activeMatches = new Map();
  }

  addPlayer(player, gameType) {
    const key = gameType === 2 ? '2-player' : '4-player';
    this.waitingPlayers[key].push(player);
    return this.checkForMatch(gameType);
  }

  removePlayer(playerId, gameType) {
    const key = gameType === 2 ? '2-player' : '4-player';
    this.waitingPlayers[key] = this.waitingPlayers[key].filter(
      p => p.id !== playerId
    );
  }

  checkForMatch(gameType) {
    const key = gameType === 2 ? '2-player' : '4-player';
    const waitingPlayers = this.waitingPlayers[key];

    if (waitingPlayers.length >= gameType) {
      const matchPlayers = waitingPlayers.splice(0, gameType);
      const matchId = this.generateMatchId();
      
      this.activeMatches.set(matchId, {
        id: matchId,
        players: matchPlayers,
        type: gameType,
        status: 'ready',
        createdAt: new Date()
      });

      return { matched: true, matchId, players: matchPlayers };
    }

    return { matched: false };
  }

  generateMatchId() {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMatch(matchId) {
    return this.activeMatches.get(matchId);
  }

  getWaitingCount(gameType) {
    const key = gameType === 2 ? '2-player' : '4-player';
    return this.waitingPlayers[key].length;
  }
}

module.exports = new MatchmakingService();
