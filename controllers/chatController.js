const User = require('../models/userModel')
const Message=require('../models/messageModel')

const loadUserChat = (req, res) => {
     if (!req.user) {
    return res.redirect('/login')
  }
  res.render('user/chat', { user: req.user })
}

const loadAdminChat = async (req, res) => {
  try {
    const userId = req.params.userId;
    const selectedUser = await User.findById(userId)

    if (!selectedUser) {
      return res.status(404).send('User not found')
    }

    res.render('admin/chat', {
      admin: req.admin,
      selectedUser
    });
  } catch (err) {
    console.error(err)
    res.status(500).send('Server Error')
  }
};

module.exports = { 
    loadUserChat, 
    loadAdminChat }
