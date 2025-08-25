const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

function decodeJWT(req, res, next) {
  const token = req.cookies.token
  if (token)
  {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // Store user data in req.user
    res.locals.isLoggedIn=true
    res.locals.name=decoded.name
  } catch (err) {
    req.user = null
    res.locals.isLoggedIn=false
    res.locals.name=''
  }

}else{
  req.user=null
  res.locals.isLoggedIn=false
  res.locals.name=''
}
next()
}

module.exports = decodeJWT
