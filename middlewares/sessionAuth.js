
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const sessionAuth = async (req, res, next) => {
    try {
        if (req.session.userId) return next()


        // 2. If JWT exists in cookies, verify and set session
        const token = req.cookies.userToken
        if (!token) return res.redirect('/login')  // not logged in

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.userId)
        if (!user) return res.redirect('/login')

        // set session
        req.session.userId = user._id
        req.session.userEmail = user.email
        req.user = user 

        next()
    } catch (err) {
        console.error('Session Auth Error:', err)
        return res.redirect('/login')
    }
}

module.exports = sessionAuth
