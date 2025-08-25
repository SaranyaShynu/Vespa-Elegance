const express=require('express')
const env=require('dotenv').config()
const app=express()
const http=require('http')
const server=http.createServer(app)
const path=require('path')
const db=require('./config/db')
const passport=require('./config/passport')
const userRoute=require('./routes/userRoute')
const adminRoute=require('./routes/adminRoute')
const cookieParser=require('cookie-parser')
const decodeJWT = require("./middlewares/decodeJWT")
const Message=require('./models/messageModel')
const auth=require('./middlewares/auth')

const socketIo=require('socket.io')
const io=socketIo(server)

app.set('io',io)

app.get('/chat',auth.userAuth, (req, res) => {
  res.render(user.isAdmin? 'admin/chat' :'user/chat')
});

io.on('connection',socket=>{
  console.log('User connected')

socket.on('chat message',async(msgData)=>{
  try {
    const {userId,content}=msgData
    const message=await Message.create({
      sender:userId,
      content,
      isFromAdmin:false}) //save toDB

    io.emit('chat message',{
   content:message.content,
   sender:message.sender,
   createdAt:message.createdAt }
    )        //broadcast to users
  } catch (err) {
    console.error('Failed to save message',err.message)
  }         
})

socket.on('disconnect',()=>{
  console.log('User disconnected')
})
})

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.user // true if logged in
  res.locals.welcomeMessage = req.user ? req.user.name : ''
  next()
})



/*User home
app.get('/', (req, res) => {
  res.render('user/home', { layout: 'layout/userLayout' })
});

Admin dashboard
app.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard', { layout: 'layout/adminLayout' })
})    */

db()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.cookies.token // true if token exists
  res.locals.welcomeMessage = req.cookies.welcome_message || null
  next()
})

app.use(passport.initialize())
app.use('/user', userRoute)
app.use('/admin',adminRoute)

app.use(decodeJWT);
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname,'public')))
app.use('/',userRoute)

app.use((req,res,next)=>{
    res.locals.query=req.query

    next()
})     


server.listen(process.env.PORT,()=>{
    console.log(`Server Connected:http://localhost:${process.env.PORT}`)
})

module.exports=app