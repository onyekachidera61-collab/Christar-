const { authenticateSocket } = require('../middleware/auth');
const LudoEngine = require('../services/ludoEngine');
const matchmakingService = require('../services/matchmakingService');
const walletService = require('../services/walletService');
const pool = require('../config/database');

const activeGames = new Map();
const playerSockets = new Map();

module.exports = (io) => {
  const gameNamespace = io.of('/game');

  gameNamespace.use(authenticateSocket);

  gameNamespace.on('connection', (socket) => {
    console.log(`Player connected: ${socket.userId}`);
    playerSockets.set(socket.userId, socket);

    // Find match
    socket.on('game:find-match', async (data) => {
      const { playerCount, gameType, entryFee } = data;

      try {
        // Check wallet if money match
        if (gameType === 'money') {
          const balance = await walletService.getBalance(socket.userId);
          if (balance < entryFee) {
            socket.emit('game:error', { message: 'Insufficient balance' });
            return;
          }
        }

        const playerData = {
          id: socket.userId,
          socketId: socket.id,
          playerCount
        };

        const result = matchmakingService.addPlayer(playerData, playerCount);

        if (result.matched) {
          const matchId = result.matchId;
          const gameEngine = new LudoEngine(playerCount);
          gameEngine.initializeGame(result.players);
          activeGames.set(matchId, gameEngine);

          // Emit match found to all players
          result.players.forEach((player) => {
            const playerSocket = playerSockets.get(player.id);
            if (playerSocket) {
              playerSocket.emit('game:match-found', {
                matchId,
                players: result.players,
                gameState: gameEngine.getGameState()
              });
            }
          });
        } else {
          socket.emit('game:waiting', {
            message: 'Waiting for players',
            waiting: matchmakingService.getWaitingCount(playerCount)
          });
        }
      } catch (error) {
        socket.emit('game:error', { message: error.message });
      }
    });

    // Join match
    socket.on('game:join-match', (data) => {
      const { matchId } = data;
      const gameEngine = activeGames.get(matchId);

      if (!gameEngine) {
        socket.emit('game:error', { message: 'Match not found' });
        return;
      }

      socket.join(matchId);
      socket.matchId = matchId;

      // Notify all players
      gameNamespace.to(matchId).emit('game:player-joined', {
        gameState: gameEngine.getGameState()
      });
    });

    // Roll dice
    socket.on('game:roll-dice', (data) => {
      const { matchId } = data;
      const gameEngine = activeGames.get(matchId);

      if (!gameEngine) return;

      // Verify it's current player's turn (server-side validation)
      const currentPlayer = gameEngine.players[gameEngine.currentPlayer];
      if (currentPlayer.id !== socket.userId) {
        socket.emit('game:error', { message: 'Not your turn' });
        return;
      }

      const diceResult = gameEngine.rollDice();

      io.of('/game').to(matchId).emit('game:dice-rolled', {
        playerId: socket.userId,
        diceResult,
        canRollAgain: diceResult === 6
      });
    });

    // Move token
    socket.on('game:move-token', (data) => {
      const { matchId, tokenId } = data;
      const gameEngine = activeGames.get(matchId);

      if (!gameEngine) return;

      const playerIndex = gameEngine.players.findIndex(
        p => p.id === socket.userId
      );

      if (playerIndex === -1 || playerIndex !== gameEngine.currentPlayer) {
        socket.emit('game:error', { message: 'Invalid move' });
        return;
      }

      const result = gameEngine.moveToken(
        playerIndex,
        tokenId,
        gameEngine.diceResult
      );

      if (!result.success) {
        socket.emit('game:error', { message: result.message });
        return;
      }

      // Check for winner
      const winner = gameEngine.checkWinner();

      if (winner) {
        handleGameEnd(matchId, gameEngine, io);
        return;
      }

      // If not 6, move to next player
      if (gameEngine.diceResult !== 6) {
        gameEngine.skipTurn();
      }

      io.of('/game').to(matchId).emit('game:state-updated', {
        gameState: gameEngine.getGameState(),
        lastMove: result
      });
    });

    // Skip turn
    socket.on('game:skip-turn', (data) => {
      const { matchId } = data;
      const gameEngine = activeGames.get(matchId);

      if (!gameEngine) return;

      gameEngine.skipTurn();

      io.of('/game').to(matchId).emit('game:turn-skipped', {
        gameState: gameEngine.getGameState()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.userId}`);
      playerSockets.delete(socket.userId);
    });
  });
};

async function handleGameEnd(matchId, gameEngine, io) {
  const winner = gameEngine.players.find(p => p.status === 'winner');

  io.of('/game').to(matchId).emit('game:ended', {
    winner: winner,
    finalState: gameEngine.getGameState()
  });

  // Store match result in database
  try {
    await pool.query(
      'INSERT INTO matches (match_id, status, winner_id, game_data) VALUES (?, ?, ?, ?)',
      [matchId, 'completed', winner.id, JSON.stringify(gameEngine.getGameState())]
    );
  } catch (error) {
    console.error('Error storing match result:', error);
  }

  // Clean up
  activeGames.delete(matchId);
}
