const { authenticateSocket } = require('../middleware/auth');

module.exports = (io) => {
  const notificationNamespace = io.of('/notifications');

  notificationNamespace.use(authenticateSocket);

  notificationNamespace.on('connection', (socket) => {
    console.log(`User connected for notifications: ${socket.userId}`);
    socket.join(`user_${socket.userId}`);

    // Send notification
    socket.on('notification:send', (data) => {
      const { recipientId, message, type } = data;
      
      notificationNamespace.to(`user_${recipientId}`).emit('notification:received', {
        from: socket.userId,
        message,
        type,
        timestamp: new Date()
      });
    });

    // Friend request
    socket.on('friend:request', (data) => {
      const { friendId } = data;
      
      notificationNamespace.to(`user_${friendId}`).emit('friend:request-received', {
        from: socket.userId,
        timestamp: new Date()
      });
    });

    // Friend request accepted
    socket.on('friend:accept', (data) => {
      const { friendId } = data;
      
      notificationNamespace.to(`user_${friendId}`).emit('friend:accepted', {
        from: socket.userId,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};
