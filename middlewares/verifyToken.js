// /middlewares/verifyToken.js
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        return res.redirect('/user/login')
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        res.locals.user = decoded    //make available to views
        next()
    } catch (err) {
        console.error('JWT verification failed:', err)
        return res.redirect('/user/login')
    }
};

module.exports = verifyToken
