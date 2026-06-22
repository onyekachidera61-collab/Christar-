module.exports = (io) => {
  const matchNamespace = io.of('/match');

  matchNamespace.on('connection', (socket) => {
    console.log('Match socket connected:', socket.id);

    // Create private room
    socket.on('match:create-room', (data) => {
      const { roomCode, playerName } = data;
      socket.join(roomCode);
      
      matchNamespace.to(roomCode).emit('match:player-joined', {
        playerName,
        playersInRoom: matchNamespace.adapter.rooms.get(roomCode)?.size || 0
      });
    });

    // Join private room
    socket.on('match:join-room', (data) => {
      const { roomCode, playerName } = data;
      socket.join(roomCode);
      
      matchNamespace.to(roomCode).emit('match:player-joined', {
        playerName,
        playersInRoom: matchNamespace.adapter.rooms.get(roomCode)?.size || 0
      });
    });

    // Send invitation
    socket.on('match:invite-friend', (data) => {
      const { friendSocketId, matchId } = data;
      matchNamespace.to(friendSocketId).emit('match:invitation-received', {
        matchId
      });
    });
  });
};
