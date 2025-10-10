// sockets/chatSocket.js
const messageController = require('../controllers/admin/messageController')
const User = require('../models/userModel')

const onlineUsers = {}  // { roomId: socketId }

function chatSocket(io) {
  io.on('connection', (socket) => {
    console.log('User connected', socket.id)

    socket.on('joinRoom', (roomId) => {
      if (!roomId) return

      socket.join(roomId)
      onlineUsers[roomId] = socket.id

      // Notify admin dashboard about online users
      io.to('adminRoom').emit('updateOnlineUsers', Object.keys(onlineUsers))

      console.log(`User joined room ${roomId}`)
    })

    socket.on('joinAdminRoomForUser', (userId) => {
      if (!userId) return

      socket.join(userId)        // admin joins specific user room
      socket.join('adminRoom')  // admin also joins admin dashboard
console.log(`Admin joined user room ${userId}`)
      io.to(socket.id).emit('updateOnlineUsers', Object.keys(onlineUsers))
      
    })
    // Handle chat messages
    socket.on('chat message', async (msgData) => {
      try {
        // Save message to DB
        const savedMsg = await messageController.saveMessage(msgData)
           const emitMsg = {
          _id: savedMsg._id,
          sender: savedMsg.sender,
          senderName: savedMsg.senderName || "User",
          content: savedMsg.content,
          isFromAdmin: savedMsg.isFromAdmin,
          roomId: savedMsg.roomId,
          createdAt: savedMsg.createdAt
        }

       
      io.to(msgData.roomId).emit('chat message', emitMsg)
    
        console.log(`Message sent to room ${msgData.roomId} and adminRoom`)
      } catch (err) {
        console.error('Chat save failed:', err)
      }
    })
  
    socket.on('disconnect', () => {
      for (let roomId in onlineUsers) {
        if (onlineUsers[roomId] === socket.id) {
          delete onlineUsers[roomId]

          // Update admin dashboard with current online users
          io.to('adminRoom').emit('updateOnlineUsers', Object.keys(onlineUsers))
          console.log(`User disconnected ${roomId}`)
          break
        }
      }
      console.log('User disconnected', socket.id)
    })
  })
}

module.exports = chatSocket
