// sockets/chatSocket.js
const messageController = require('../controllers/admin/messageController');

const onlineUsers = {}; // { roomId: socketId }

function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected', socket.id);

    // ---------------------------
    // User joins their own room
    // ---------------------------
    socket.on('joinRoom', (roomId) => {
      if (!roomId) return;

      socket.join(roomId);
      onlineUsers[roomId] = socket.id;

      // Notify admin dashboard about online users
      io.to('adminRoom').emit('updateOnlineUsers', Object.keys(onlineUsers));

      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // ---------------------------
    // Admin joins a user room + admin dashboard
    // ---------------------------
    socket.on('joinAdminRoomForUser', (userId) => {
      if (!userId) return;

      socket.join(userId);       // admin joins specific user room
      socket.join('adminRoom');  // admin also joins admin dashboard

      io.to(socket.id).emit('updateOnlineUsers', Object.keys(onlineUsers));
      console.log(`Admin ${socket.id} joined user room ${userId}`);
    });

    // ---------------------------
    // Handle chat messages
    // ---------------------------
    socket.on('chat message', async (msgData) => {
      try {
        // Save message to DB
        const savedMsg = await messageController.saveMessage(msgData);

        // Emit to user's room
        io.to(msgData.roomId).emit('chat message', savedMsg);

        // Emit to admin dashboard
        io.to('adminRoom').emit('chat message', savedMsg);

        console.log(`Message sent to room ${msgData.roomId} and adminRoom`);
      } catch (err) {
        console.error('Chat save failed:', err);
      }
    });

    // ---------------------------
    // Handle disconnect
    // ---------------------------
    socket.on('disconnect', () => {
      for (let roomId in onlineUsers) {
        if (onlineUsers[roomId] === socket.id) {
          delete onlineUsers[roomId];

          // Update admin dashboard with current online users
          io.to('adminRoom').emit('updateOnlineUsers', Object.keys(onlineUsers));
          console.log(`User ${socket.id} removed from room ${roomId}`);
          break;
        }
      }
      console.log('User disconnected', socket.id);
    });
  });
}

module.exports = chatSocket;
