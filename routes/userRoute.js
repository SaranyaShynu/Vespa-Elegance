const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const chatController=require('../controllers/chatController')
const jwt=require('jsonwebtoken')
const session=require('express-session')
const generateInvoice = require('../utils/generateInvoice')
const passport = require('passport')
const verifyToken = require('../middlewares/verifyToken')
const auth=require('../middlewares/auth')
const sessionAuth = require('../middlewares/sessionAuth')

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
router.get('/auth/google/callback',passport.authenticate('google',{session:false}),
async(req,res)=>{
   const user=req.user
   const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
   res.cookie('userToken',token,{httpOnly:true})  
    res.redirect('/')
})
router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/forgotPassword',userController.loadForgotpassword)
router.post('/forgotPassword',userController.sendOtpforgotPassword)
router.post('/resetOtp',userController.verifyResetotp)
router.post('/resetPassword',userController.resetPassword)
router.get('/logout', userController.logout)

router.get('/profile', auth.userAuth, userController.profilePage)
router.get('/profile/edit', auth.userAuth, userController.editProfilePage)
router.post('/profile/edit', auth.userAuth, userController.updateProfile)
router.post('/profile/address/add', sessionAuth, userController.addAddress)


router.get('/service',userController.getService)

router.get('/model',userController.getModels)
router.get('/model/:id',userController.getModelDetails)
router.post('/model/rate',auth.userAuth,userController.postRating)

router.post('/cart/add',auth.userAuth,userController.addtoCart)
router.get('/cart',auth.userAuth,userController.getCart)
router.post('/cart/update',auth.userAuth,userController.updateCart)
router.get('/cart/remove/:id',auth.userAuth,userController.removefromCart)

router.get('/checkout',sessionAuth,userController.loadCheckout)
router.post('/checkout/cod',sessionAuth,userController.applyCoupon)
router.post('/checkout/place-order',sessionAuth,userController.placeCheckout)
//router.post('/confirm-order',auth.userAuth,userController.confirmOrder)
router.get('/payment-success', sessionAuth, userController.paymentSuccess)
router.get('/invoice/:id', sessionAuth, userController.invoice)

/* router.get('/stripe-checkout', auth.userAuth, (req, res) => {
        res.render('user/stripeCheckout', {
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        })
   }) */


router.get('/myorders',sessionAuth,userController.getOrders)
router.get('/myorders/:id/orderDetails',sessionAuth,userController.getOrderDetails)
router.post("/myorders/:id/cancel", sessionAuth,userController.cancelOrder)

router.post('/feedback',auth.userAuth,userController.postFeedback)
router.get('/feedback',userController.getFeedback)
router.get('/chat',auth.userAuth,chatController.loadUserChat)

router.get('/wishlist',auth.userAuth,userController.getWishlist)
router.post('/wishlist/add/:productId',auth.userAuth,userController.addtoWishlist)
router.post('/wishlist/toggle/:productId',auth.userAuth,userController.toggleWishlist)
router.post('/wishlist/remove/:productId',auth.userAuth,userController.removefromWishlist)



module.exports=router