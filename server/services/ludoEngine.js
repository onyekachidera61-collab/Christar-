const constants = require('../config/constants');

class LudoEngine {
  constructor(playerCount = 2) {
    this.playerCount = playerCount;
    this.players = [];
    this.currentPlayer = 0;
    this.diceResult = 0;
    this.gameState = 'waiting';
    this.turnCount = 0;
  }

  initializeGame(players) {
    this.players = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      color: index,
      tokens: this.getStartPositions(index),
      homeCount: 0,
      status: 'active',
      out: false
    }));
    this.gameState = 'in_progress';
    this.currentPlayer = 0;
    this.turnCount = 0;
  }

  getStartPositions(playerIndex) {
    return [
      { id: 0, position: -1, inHome: true },
      { id: 1, position: -1, inHome: true },
      { id: 2, position: -1, inHome: true },
      { id: 3, position: -1, inHome: true }
    ];
  }

  rollDice() {
    this.diceResult = Math.floor(Math.random() * 6) + 1;
    return this.diceResult;
  }

  canMoveToken(playerIndex, tokenId, diceValue) {
    const player = this.players[playerIndex];
    const token = player.tokens[tokenId];

    // Token in home
    if (token.inHome) {
      return diceValue === 6;
    }

    // Token on board
    return true;
  }

  moveToken(playerIndex, tokenId, diceValue) {
    const player = this.players[playerIndex];
    const token = player.tokens[tokenId];

    if (!this.canMoveToken(playerIndex, tokenId, diceValue)) {
      return { success: false, message: 'Invalid move' };
    }

    let newPosition = token.position;

    if (token.inHome && diceValue === 6) {
      token.inHome = false;
      newPosition = playerIndex * 13;
    } else if (!token.inHome) {
      newPosition = token.position + diceValue;
      
      // Check if token reached home
      if (newPosition >= 52) {
        const homeStretch = newPosition - 52;
        if (homeStretch <= constants.HOME_STRETCH) {
          token.position = 52 + homeStretch;
          if (homeStretch === constants.HOME_STRETCH) {
            token.inHome = true;
            player.homeCount++;
            if (player.homeCount === 4) {
              player.status = 'winner';
            }
          }
          return { success: true, tokenPosition: token.position, killed: [] };
        }
        return { success: false, message: 'Overshooting home stretch' };
      }
    }

    token.position = newPosition;

    // Check for killing opponent tokens
    const killed = this.killOpponentTokens(playerIndex, newPosition);

    return {
      success: true,
      tokenPosition: newPosition,
      killed: killed,
      allHomeCount: player.homeCount
    };
  }

  killOpponentTokens(playerIndex, position) {
    const killed = [];
    const isSafe = constants.SAFE_CELLS.includes(position);

    if (isSafe) return killed;

    for (let i = 0; i < this.players.length; i++) {
      if (i === playerIndex) continue;

      const opponent = this.players[i];
      for (let j = 0; j < opponent.tokens.length; j++) {
        const token = opponent.tokens[j];
        if (!token.inHome && token.position === position) {
          token.inHome = true;
          token.position = -1;
          killed.push({ playerIndex: i, tokenId: j });
        }
      }
    }

    return killed;
  }

  skipTurn() {
    this.currentPlayer = (this.currentPlayer + 1) % this.playerCount;
    this.turnCount++;
  }

  checkWinner() {
    return this.players.find(p => p.status === 'winner');
  }

  getGameState() {
    return {
      players: this.players,
      currentPlayer: this.currentPlayer,
      diceResult: this.diceResult,
      gameState: this.gameState,
      turnCount: this.turnCount
    };
  }
}

module.exports = LudoEngine;
