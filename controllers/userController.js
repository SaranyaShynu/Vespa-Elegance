
const User = require('../models/userModel')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { generateToken, verifyToken } = require('../utils/jwtHelper')
const Order=require('../models/orderModel')
const Coupon=require('../models/couponModel')
const Feedback=require('../models/feedbackModel')


const pageNotFound = async (req, res) => {
    try {
        res.render('page.404')
    } catch (err) {
        res.redirect('/pageNotFound')
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            html: `<b>Your OTP : ${otp}</b>`
        })
        return info.accepted.length > 0
    } catch (error) {
        console.error('Error sending email', error)
        return false
    }
}

const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10)
    } catch (error) {
        console.error('Password hashing error:', error)
        return null
    }
}


const loadSignup = async (req, res) => {
    try {
        return res.render('user/signUp', { message: null, success: [] })
    }
    catch (err) {
        console.error('Signup page error', err)--+
        res.status(500).send('Server error')
    }
}


const signUp = async (req, res) => {
    try {
        const { name, email, mobileno, password,confirmPassword } = req.body
        if(password!==confirmPassword){
            return res.render('user/signUp',{message:'Passwords do not match',success:''})
        }
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            return res.render('user/signUp', { message: 'Email already registered',success:'' });
        }
        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(email, otp)
        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Email sending failed' })
        }

        const token = jwt.sign({
            userData: { name, email, mobileno, password },
            otp
        },
            process.env.JWT_SECRET, { expiresIn: '1m' })
        res.cookie('verifyToken', token, { httpOnly: true, secure: false, sameSite: 'Strict' })
        console.log('OTP Sent', otp)
        res.render('user/verify-otp')

    }
    catch (err) {
        console.error('Error during signup', err)
        res.redirect('/pageNotFound')
    }
}


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body
        const token = req.cookies.verifyToken
        if (!token) {
            return res.status(401).json({ success: false, message: 'Verification expired. Please register again.' })
        }
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)

        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'OTP Expired. Please register again.' })
            }
            return res.status(400).json({ success: false, message: 'Invalid verification link/token' })
        }

        if (otp !== decoded.otp) {
            return res.render('user/verify-otp', { message: 'Invalid OTP, please try again' })
        }

        const hashedPassword = await securePassword(decoded.userData.password)
        const savedUserData = new User({
            name: decoded.userData.name,
            email: decoded.userData.email,
            mobileno: decoded.userData.mobileno,
            password: hashedPassword
        })
        await savedUserData.save()
        res.clearCookie('verifyToken')
        res.status(200).json({ success: true, redirectUrl: '/' })
    } catch (error) {
        console.error('Error Verifying OTP', error)
        res.status(500).json({ success: false, message: 'An error occured' })
    }
}

const resendOtp = async (req, res) => {
    try {
        const token = req.cookies.verifyToken
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token expired or missing' })
        }
        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'OTP Expired. Please signuo again' })
            }
            return res.status(400).json({ success: false, message: 'Invalid Token' })
        }
        const newOtp = generateOtp()

        const emailSent = await sendVerificationEmail(decoded.userData.email, newOtp)
        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Failed to Resend OTP.' })
        }
        const newToken = jwt.sign(
            {
                userData: decoded.userData,
                otp: newOtp
            },
            process.env.JWT_SECRET,
            { expiresIn: '3m' })

        res.cookie('verifyToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' }) // secure:true in production
        console.log('Resent OTP:', newOtp);
        res.status(200).json({ success: true, message: 'OTP resent successfully' })
    } catch (error) {
        console.error("Error resending OTP", error)
        res.status(500).json({ success: false, message: 'Internal Server error. Please try again' })
    }
}

const loadLogin = async (req, res) => {
    try {
        const token = req.cookies.token
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            if (decoded) {
                return res.redirect('/')
            }
        }
        res.render('user/login', { message: null })
    } catch (err) {

        return res.render('user/login', { message: null })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
         if (!email || !password) {
      return res.status(400).send('Email and password are required')
    }
        const findUser = await User.findOne({ isAdmin: 0, email: email })
        if (!findUser) {
            return res.render('user/login', { message: 'User not found' })
        }
        if (findUser.isBlocked) {
            return res.render('user/login', { message: 'User is blocked by Admin!' })
        }
        const isMatch = await bcrypt.compare(password, findUser.password)
        if (!isMatch) {
            return res.render('user/login', { message: 'Incorrect password' })
        }
        const token = jwt.sign(
            { userId: findUser._id, name: findUser.name, email: findUser.email},
            process.env.JWT_SECRET,
            { expiresIn: '1d' })

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })
        res.cookie('welcome_message',findUser.name,{httpOnly:false})
        res.redirect('/')
    } catch (error) {
        console.error('Login Error', error)
        res.render('user/login', { message: 'Login Failed, Try again later' })
    }
}

const loadForgotpassword =async (req,res)=>{
    res.render('user/forgotPassword',{message:null})
}

const sendOtpforgotPassword= async (req,res)=>{
     const{email}=req.body
     const user=await User.findOne({email})
     if(!user){
        return res.render('user/forgotPassword',{message:'User not found'})
     }
     const otp=generateOtp()
     const token=jwt.sign({email,otp},process.env.JWT_SECRET,{expiresIn:'5m'})
     await sendVerificationEmail(email,otp)
     console.log('Otp sent:',otp)
     res.cookie('resetToken',token,{httpOnly:true,maxAge:5*60*1000})
     res.render('user/resetOtp',{message:'Otp Sent to your Email'})
}

const verifyResetotp=async (req,res)=>{
    const{otp}=req.body
    try{
        const decoded=jwt.verify(req.cookies.resetToken,process.env.JWT_SECRET)
        if(decoded.otp!==otp){
            return res.render('user/resetOtp',{message:'Invalid Otp'})
        }
        res.render('user/resetPassword',{email:decoded.email,message:null})
    }catch(err){
        return res.render('user/forgotPassword',{message:'Otp Expired'})
    }
}

const resetPassword=async (req,res)=>{
    try{
    const {email,password}=req.body
    const hashedPassword=await bcrypt.hash(password,10)
    await User.updateOne({email:email},
       { $set :{password:hashedPassword}})

    return res.render('user/login',{message:null,success:'Password changed successfully!'})
}catch(err){
    console.error('Reset password error:',err)
    return res.render('user/resetPassword',{message:'Something went wrong. Try again'})
}
}

const loadHomepage = async (req, res) => {
    try {
        const token=req.cookies.token
        let name=''
        let isLoggedIn=false
        let isAdmin = false
        if(token){
            try{
                const decoded=jwt.verify(token,process.env.JWT_SECRET)
                isLoggedIn=true
                name=decoded.name
                isAdmin = decoded.isAdmin || false
            } catch(err){
                res.clearCookie('token')
            }
        }


        return res.render('user/home', {
            user: isLoggedIn ? {name}:null,
            cartCount: 0,
            isLoggedIn,
            name
        })
    } catch (err) {
    console.error("Homepage error", err)
    res.status(500).send("Server error")
  }
}
/*   return res.render('user/home', {user,cartCount: 0,
     isLoggedIn: req.user ? true : false,
     name: req.user?.name || ""
   })
}catch(err)
{
   console.log("Homepage error",err)
   res.status(500).send("Server error")
}
}*/

const logout = async (req, res) => {
    try{
        res.clearCookie('token')
        res.clearCookie("welcome_message")
    
        return res.redirect('/')
       }   catch(err){
                console.error('Logout error',err)
                res.redirect('/login')
            }
}

const loadShopping = async (req, res) => {
    try {
        return res.render('shop')
    }
    catch (err) {
        console.log('Shopping page not loading:', err)
        res.status(500).send(('Server Error'))
    }
}

const getService=(req,res)=>{
    res.render('user/service')
}

const createOrder=async (req,res)=>{
    try {
     const {userId,products,price,address,alternativeAddress,paymentMethod,paymentStatus}=req.body

     const order=new Order({user:userId,products,price,address,paymentMethod,paymentStatus})

     await order.save()
     res.status(201).json({message:'Order placed',orderId:newOrder.orderId})
    } catch (err) {
        console.error(err)
        res.status(500).json({error:'Failed to place order'})
    }
}

const getOrders= async (req,res)=>{
    try {
        const orders=await Order.find({userId:req.user._id}).sort({createdAt:-1})
        res.render('user/myorders',{orders})
    } catch (err) {
        res.status(500).send('Failed to fetch Orders')
    }
}

const getOrderDetails=async (req,res)=>{
    try {
        const order=await Order.findOne({_id:req.params.id,userId:req.user._id})
        if(!order)
        {
            return res.status(404).send('Order not Found')
        }
        res.render('user/orderDetails',{order})
    } catch (err) {
        res.status(500).send('Failed to fetch order details')
    }
}

const placeOrder=async (req,res)=>{
    try {
        const userId=req.user._id
        const {cartItems,address,couponCode}=req.body

        let discountValue=0
        let couponApplied=null
        if(couponCode){
            const coupon=await Coupon.findOne({code:couponCode.toUpperCase()})

            if(coupon && new Date(coupon.expiredOn) >= new Date() && !coupon.usedBy.includes(userId)){
                couponApplied=coupon

                if(coupon.discountType==='percentage'){
                    discountValue=cartItemsTotal * (coupon.discountValue/100)
                }else{
                    discountValue=coupon.discountValue
                }

                coupon.usedBy.push(userId)
                await coupon.save
            }
        }

        const newOrder=new Order({
            user:userId,
            cartItems,
            address,
            totalAmount:cartItemsTotal-discountValue,
            coupon:couponApplied ? couponApplied._id:null
        })

        await newOrder.save()
        res.redirect('/admin/myorders-success')
    } catch (err) {
        console.error('Error placing order',err.message)
        res.status(500).send('Server Error')
        
    }
}

const postFeedback=async (req,res)=>{
    try {
        const{name,email,message}=req.body
        const feedback=new Feedback({
            user:req.user ? req.user._id:null,
            name,
            email,
            message
        })

        await feedback.save()
        res.redirect('/admin/feedback?success=true')
    } catch (err) {
        console.error('Feedback error',err.message)
        res.redirect('/admin/feedback?error=true')
    }
}


module.exports = {
    loadSignup,
    signUp,
    verifyOtp,
    resendOtp,
    loadHomepage,
    loadLogin,
    login,
    loadForgotpassword,
    sendOtpforgotPassword,
    verifyResetotp,
    resetPassword,
    pageNotFound,
    loadShopping,
    logout,
    getService,
    createOrder,
    getOrders,
    getOrderDetails,
    placeOrder,
    postFeedback
}