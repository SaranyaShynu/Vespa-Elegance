const express=require('express')
const env=require('dotenv').config()
const app=express()
const session = require('express-session')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const http=require('http')
const server=http.createServer(app)
const bodyParser = require('body-parser')
const path=require('path')
const db=require('./config/db')
const passport=require('./config/passport')
const userRoute=require('./routes/userRoute')
const adminRoute=require('./routes/adminRoute')
const cookieParser=require('cookie-parser')
const decodeJWT = require("./middlewares/decodeJWT")
const auth=require('./middlewares/auth')
const chatSocket = require('./sockets/chatSocket')
const socketIo=require('socket.io')
const io=socketIo(server)
chatSocket(io)

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.user // true if logged in
  res.locals.welcomeMessage = req.user ? req.user.name : ''
  next()
})

db()
app.use(cookieParser())
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000}
}))

app.use(passport.initialize())
//app.use(passport.session())

app.use(decodeJWT)

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.user // true if token exists
  res.locals.welcomeMessage = req.user ? `Welcome ${req.user.name}` : ''
  res.locals.query = req.query
  next()
})


app.use('/user', userRoute)
app.use('/admin',adminRoute)

app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname,'public')))
app.use('/',userRoute)

app.use((req,res,next)=>{
    res.locals.query=req.query

    next()
})     

app.get('/chat',auth.userAuth, (req, res) => {
   if (req.user && req.user.isAdmin) {
    res.render('admin/chat', { admin: req.user });
  } else {
  res.render('user/chat' , {user:req.user})
  }
})

server.listen(process.env.PORT,()=>{
    console.log(`Server Connected:http://localhost:${process.env.PORT}`)
})

module.exports=app