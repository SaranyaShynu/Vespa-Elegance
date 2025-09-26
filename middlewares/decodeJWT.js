const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const JWT_SECRET = process.env.JWT_SECRET

async function decodeJWT(req, res, next) {
  try {
    const token = req.cookies.userToken
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await User.findById(decoded.userId).lean()

      if (user) {
        req.user = user
        res.locals.user = user
        res.locals.isLoggedIn = true
        res.locals.welcomeMessage = user.name
      } else {
        req.user = null
        res.locals.user = null
        res.locals.isLoggedIn = false
        res.locals.welcomeMessage = ""
      }
    } else {
      req.user = null
      res.locals.user = null
      res.locals.isLoggedIn = false
      res.locals.welcomeMessage = ""
    }
  } catch (err) {
    req.user = null
    res.locals.user = null
    res.locals.isLoggedIn = false
    res.locals.welcomeMessage = ""
  }

  next()
}

module.exports = decodeJWT
