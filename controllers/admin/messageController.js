const Message = require('../../models/messageModel');

const getChatHistory = async (req, res) => {
  try {
    const roomId = req.params.roomId       // user._id for room
    const messages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
    res.json(messages)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
}

const saveMessage = async (msgData) => {

  if (!msgData.roomId || (!msgData.sender && !msgData.isFromAdmin)) {
    throw new Error('roomId and sender are required')
  }

  const messageData = {
    roomId: msgData.roomId,
    content: msgData.content,
    sender: msgData.isFromAdmin ? null : msgData.sender,
    senderName: msgData.senderName, 
    isFromAdmin: msgData.isFromAdmin
  }

   if (!msgData.isFromAdmin && msgData.sender) {                // Only set sender for user messages (not admin)
    messageData.sender = msgData.sender;
  }

  const message = await Message.create(messageData)
  return message
}

module.exports={
    getChatHistory,
    saveMessage
}