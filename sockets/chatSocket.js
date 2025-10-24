// sockets/chatSocket.js
const messageController = require('../controllers/admin/messageController')
const User = require('../models/userModel')
/* onlineUsers = {
  userId: { socketId, name }
  } */
 
const onlineUsers = {}

function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // USER joins their personal room
    socket.on('joinRoom', async (roomId) => {
      if (!roomId) return
      socket.join(roomId)

      try {
        const user = await User.findById(roomId).select('name')
        const name = user ? user.name : 'Guest'
        onlineUsers[roomId] = { socketId: socket.id, name }

        // Notify all admins of updated online list
        io.to('adminRoom').emit('updateOnlineUsers', formatOnlineUsers())
        console.log(`User ${name} (${roomId}) joined room.`)
      } catch (err) {
        console.error('Error joining user room:', err)
      }
    })

    // ADMIN joins global admin room and optionally a user room
    socket.on('joinAdminRoomForUser', (userId) => {
      socket.join('adminRoom')
      if (userId) {
        socket.join(userId)
        console.log(`Admin joined user room: ${userId}`)
      }

      // Send current online users to this admin
      io.to(socket.id).emit('updateOnlineUsers', formatOnlineUsers())
    })

    // Handle chat messages
    socket.on('chat message', async (msgData) => {
      try {
        const savedMsg = await messageController.saveMessage(msgData)

        const emitMsg = {
          _id: savedMsg._id,
          sender: savedMsg.sender,
          senderName: savedMsg.senderName || 'User',
          content: savedMsg.content,
          isFromAdmin: savedMsg.isFromAdmin,
          roomId: savedMsg.roomId,
          createdAt: savedMsg.createdAt,
        }

        io.to(msgData.roomId).emit('chat message', emitMsg)
        console.log(`Message sent in room ${msgData.roomId}`)
      } catch (err) {
        console.error('Chat save failed:', err)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      for (let userId in onlineUsers) {
        if (onlineUsers[userId].socketId === socket.id) {
          console.log(`User disconnected: ${onlineUsers[userId].name}`)
          delete onlineUsers[userId]
          io.to('adminRoom').emit('updateOnlineUsers', formatOnlineUsers())
          break
        }
      }
      console.log('Socket disconnected:', socket.id)
    })
  })
}

// Utility — formats user list for frontend
function formatOnlineUsers() {
  return Object.entries(onlineUsers).map(([id, data]) => ({
    id,
    name: data.name,
  }))
}

module.exports = chatSocket
