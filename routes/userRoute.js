const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const jwt=require('jsonwebtoken')
const passport = require('passport')
const verifyToken = require('../middlewares/verifyToken')
const auth=require('../middlewares/auth')

router.use((req, res, next) => {
  res.locals.isLoggedIn = !!req.user
  res.locals.welcomeMessage = req.user ? `Welcome ${req.user.name}` : ''
  next()
})

router.get('/profile', verifyToken, (req, res) => {
    res.render('user/profile', { user: req.user })
})
router.get('/pageNotFound',userController.pageNotFound)
router.get('/signUp',userController.loadSignup)
router.post('/signUp',userController.signUp)
router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)
router.get('/',userController.loadHomepage)
router.get('/shop',userController.loadShopping)

router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{session :false}),async (req,res)=>{
    const user=req.user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
    res.cookie('token',token,{httpOnly:true})
    res.redirect('/')
})
router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/forgotPassword',userController.loadForgotpassword)
router.post('/forgotPassword',userController.sendOtpforgotPassword)
router.post('/resetOtp',userController.verifyResetotp)
router.post('/resetPassword',userController.resetPassword)
router.get('/logout', userController.logout)

router.get('/service',userController.getService)

router.get('/myorders',auth.userAuth,userController.getOrders)
router.get('/myorders/:id',auth.userAuth,userController.getOrderDetails)

router.post('/feedback',auth.userAuth,userController.postFeedback)



module.exports=router