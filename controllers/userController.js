
const User = require('../models/userModel')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { generateToken, verifyToken } = require('../utils/jwtHelper')
const Address=require('../models/addressModel')
const Category=require('../models/categoryModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Product = require('../models/productModel')
const Wishlist = require('../models/wishlistModel')
const Cart = require('../models/cartModel')
const Feedback = require('../models/feedbackModel')
const crypto = require("crypto");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const path = require('path')
const generateInvoice = require("../utils/generateInvoice")

const pageNotFound = async (req, res) => {
    const { amount } = req.body
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
        console.error('Signup page error', err)
        res.status(500).send('Server error')
    }
}


const signUp = async (req, res) => {
    try {
        const { name, email, mobileno, password, confirmPassword } = req.body
        if (password !== confirmPassword) {
            return res.render('user/signUp', { message: 'Passwords do not match', success: '' })
        }
        const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingUser) {
            return res.render('user/signUp', { message: 'Email already registered', success: '' });
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
        const token = req.cookies.userToken
        if (token) {
            try{
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            if (decoded){
                return res.redirect('/')
            }
    } catch (err) {
res.clearCookie("userToken")
    }
}
        res.render('user/login', { message: null })
    }catch (err) {
    console.error("Load Login Error:", err)
    res.render("user/login", { message: null })
  }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).send('Email and password are required')
        }
        const findUser = await User.findOne({ email,isAdmin: 0})
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
            { userId: findUser._id, name: findUser.name, email: findUser.email,role:'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' })

        res.cookie('userToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })
        res.cookie('welcome_message', findUser.name, { httpOnly: false })

        req.session.userId = findUser._id 
        req.session.userEmail = findUser.email
        res.redirect('/')
    } catch (error) {
        console.error('Login Error', error)
        res.render('user/login', { message: 'Login Failed, Try again later' })
    }
}

const loadForgotpassword = async (req, res) => {
    res.render('user/forgotPassword', { message: null })
}

const sendOtpforgotPassword = async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        return res.render('user/forgotPassword', { message: 'User not found' })
    }
    const otp = generateOtp()
    const token = jwt.sign({ email, otp }, process.env.JWT_SECRET, { expiresIn: '5m' })
    await sendVerificationEmail(email, otp)
    console.log('Otp sent:', otp)
    res.cookie('resetToken', token, { httpOnly: true, maxAge: 5 * 60 * 1000 })
    res.render('user/resetOtp', { message: 'Otp Sent to your Email' })
}

const verifyResetotp = async (req, res) => {
    const { otp } = req.body
    try {
        const decoded = jwt.verify(req.cookies.resetToken, process.env.JWT_SECRET)
        if (decoded.otp !== otp) {
            return res.render('user/resetOtp', { message: 'Invalid Otp' })
        }
        res.render('user/resetPassword', { email: decoded.email, message: null })
    } catch (err) {
        return res.render('user/forgotPassword', { message: 'Otp Expired' })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        await User.updateOne({ email: email },
            { $set: { password: hashedPassword } })

        return res.render('user/login', { message: null, success: 'Password changed successfully!' })
    } catch (err) {
        console.error('Reset password error:', err)
        return res.render('user/resetPassword', { message: 'Something went wrong. Try again' })
    }
}

const loadHomepage = async (req, res) => {
    try {
        const token = req.cookies.userToken
        let user = null
        let isLoggedIn = false
        let cartCount=0
        let welcomeMessage = ""
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                isLoggedIn = true
                user = await User.findById(decoded.userId)
               // isAdmin = decoded.isAdmin || false
               if(user){
                welcomeMessage = `Welcome ${user.name}`
               }
            } catch (err) {
                res.clearCookie('userToken')
            }
        }


        return res.render('user/home', {
            user,
            cartCount,
            isLoggedIn
        })
    } catch (err) {
        console.error("Homepage error", err)
        res.status(500).send("Server error")
    }
}

const profilePage = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        res.render('user/profile', { user, isLoggedIn: true })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}

const editProfilePage = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        res.render('user/editProfile', { user, isLoggedIn: true })
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}

const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body

        await User.findByIdAndUpdate(req.user._id, {
            name,
            mobileno:phone
        })

        res.redirect('/profile')
    } catch (err) {
        console.error(err)
        res.status(500).send('Failed to update profile')
    }
}

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No file uploaded')

         const user = await User.findById(req.user._id)
    if (!user) return res.status(404).send('User not found')

    user.profilePic = '/images/' + req.file.filename

    await user.save()

        res.redirect('/profile')
    } catch (err) {
        console.error(err)
        res.status(500).send('Failed to upload photo')
    }
}

const addAddress = async (req, res) => {
    try {
        const userId = req.user._id
        const { street, city, state, country, zip, phone } = req.body

         if (![street, city, state, country, zip, phone].every(f => f && f.trim())) {
            return res.status(400).send('All fields are required');
        }

        const user = await User.findById(userId)
        if (!user) return res.status(404).send('User not found')

        const newAddress = { street, city, state, country, zip, phone }

        if (!user.addresses) user.addresses = []
        user.addresses.push(newAddress)

        await user.save()

        res.redirect('/profile/edit')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}

const logout = async (req, res) => {
    try {
        res.clearCookie('userToken')
        res.clearCookie("welcome_message")

        return res.redirect('/')
    } catch (err) {
        console.error('Logout error', err)
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

const getService = (req, res) => {
    res.render('user/service')
}

const getOrders = async (req, res) => {
  try {
    const userId = req.session.userId
    const orders = await Order.find({ user: userId })
      .populate('products.productId')
      .populate('couponApplied')
      .sort({ createdAt: -1 })

    const message = req.query.message || null
    const type = req.query.type || null

    res.render('user/myorders', { orders, user: req.session.user, isLoggedIn: true, message, type })
  } catch (err) {
    console.error("Error fetching orders", err)
    res.status(500).send('Failed to fetch Orders')
  }
}

const getOrderDetails = async (req, res) => {
  try {
    const userId = req.session.userId
    const order = await Order.findOne({ _id: req.params.id, user: userId })
      .populate('products.productId')
      .populate('couponApplied')

    if (!order) return res.status(404).send('Order not Found')

    res.render('user/orderDetails', { order })
  } catch (err) {
    console.error("Error fetching order details", err)
    res.status(500).send('Failed to fetch order details')
  }
}

/*const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id
        const { cartItems, address, alternativeAddress, couponCode, paymentMethod, stripePaymentId } = req.body

        let cartItemsTotal = 0
        cartItems.forEach(item => {
            cartItemsTotal += Number(item.price) * Number(item.quantity)
        })
        let discountValue = 0
        let couponApplied = null
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() })

            if (coupon && new Date(coupon.expiredOn) >= new Date() && !coupon.usedBy.includes(userId)) {
                couponApplied = coupon

                if (coupon.discountType === 'percentage') {
                    discountValue = cartItemsTotal * (coupon.discountValue / 100)
                } else {
                    discountValue = coupon.discountValue
                }

                coupon.usedBy.push(userId)
                await coupon.save()
            }
        }

        const newOrder = new Order({
            user: userId,
            products: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            address: {
                name: address.name,
                street: address.street,
                city: address.city,
                state: address.state,
                country: address.country,
                zip: address.zip,
                phone: address.phone
            },
            price: cartItemsTotal,
            discount: discountValue,
            finalPrice: cartItemsTotal - discountValue,
            alternativeAddress: alternativeAddress || null,
            paymentMethod: paymentMethod || 'COD',
            stripePaymentId: paymentMethod === 'Stripe' ? stripePaymentId : null,
            coupon: couponApplied ? couponApplied._id : null
        })

        await newOrder.save()
        res.redirect('/user/myorders-success')
    } catch (err) {
        console.error('Error placing order', err.message)
        res.status(500).send('Server Error')

    }
}     */

const postFeedback = async (req, res) => {
    try {
        const { name, email, message } = req.body
        const feedback = new Feedback({
            user: req.user ? req.user._id : null,
            name,
            email,
            message
        })

        await feedback.save()
        res.redirect('/user/feedback?success=true')
    } catch (err) {
        console.error('Feedback error', err.message)
        res.redirect('/user/feedback?error=true')
    }
}

const getFeedback = async (req, res) => {
    try {
        let query = {}                // Show only this user's feedback if logged in
        if (req.user) query.user = req.user._id

        const feedbacks = await Feedback.find(query).sort({ createdAt: -1 })
        res.render('user/feedback', { feedbacks,user: req.user || null })
    } catch (err) {
        console.error('Error loading feedback', err.message)
        res.status(500).send('Server Error')
    }
}

const getModels = async (req, res) => {
    try {
        const filter = {}
        if (req.query.category && req.query.category !== "")  {
            filter.category = req.query.category.trim()
        }
        if (req.query.subCategory && req.query.subCategory !== "") {
            filter.subCategory = req.query.subCategory.trim()
        }

        if (req.query.priceRange && req.query.priceRange !== "") {
    
      const [min, max] = req.query.priceRange.split('-').map(Number)
      if (!isNaN(min) && !isNaN(max)) {
        filter.price = { $gte: min, $lte: max }
      }
    }
        let models = await Product.find(filter).lean()
        models = models.map(model => {
            if (model.ratings && model.ratings.length > 0) {
                const total = model.ratings.reduce((acc, r) => acc + r.rating, 0)
                
                model.averageRating = (total / model.ratings.length).toFixed(1)
            } else {
                model.averageRating = 0
            }
            return model
        })

           let wishlist = []
    if (req.user) {
      const user = await User.findById(req.user._id).populate('wishlist')
      wishlist = user.wishlist.map(item => item._id.toString())
    }
 const categories = await Category.find({}).lean()
        res.render('user/model', {
            models,
            categories,
            user:req.user || null,
            isLoggedIn: !!req.user,     
            wishlist,  
            query: req.query || {}        
        })
    } catch (err) {
        console.error('Error fetching models', err)
        res.status(500).send('Server Error')
    }
}

const getModelDetails = async (req, res) => {
    try {
        const model = await Product.findById(req.params.id).populate('ratings.userId', 'name')

        if (!model) {
            return res.status(404).send('Model not Found')
        }
        res.render('user/modelDetails', {
            model,
            reviews: model.ratings,
            user: req.user,                 
            isLoggedIn: !!req.user 
        })
    } catch (err) {
        console.error('Error feting Model Details', err)
        res.status(500).send('Server Error')
    }
}

const addReview = async (req, res) => {
  try {
    const { modelId, rating, review } = req.body
    const userId = req.user?._id

    if (!userId) return res.status(401).json({ error: "Login required" })

    const product = await Product.findById(modelId)
    if (!product) return res.status(404).json({ error: "Product not found" })

    // check if already rated
    const existing = product.ratings.find(r => r.userId && r.userId.toString() === userId.toString())
    if (existing) {
      existing.rating = rating
      existing.review = review
      existing.createdAt = new Date()
    } else {
      product.ratings.push({ userId, rating, review })
    }

    await product.save()
    res.json({ success: true })
  } catch (err) {
    console.error('Add review error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

const addtoCart = async (req, res) => {
    try {
        const userId = req.user._id
        const { productId } = req.body
        const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).send('Product not found')
    }
        let cart = await Cart.findOne({ userId })

        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, price:product.price, quantity: 1 }] })
        } else {
            const itemIndex = cart.items.findIndex(
                item => item.productId.toString() === productId
            )
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1
            }
            else {
                cart.items.push({
                    productId,
                    price:product.price,
                    quantity: 1
                })
            }
        }
        await cart.save()
        
        res.redirect('/cart')
    } catch (err) {
        console.error('Error on adding to cart', err)
        res.status(500).send('Server Error')
    }
}

const getCart = async (req, res) => {
    try {
        const userId = req.user._id
        const cart = await Cart.findOne({ userId }).populate('items.productId')
          const total = cart
      ? cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0
        res.render('user/cart', { cart: cart || { items: [] },
        total,
        user: req.user,           
            isLoggedIn: true })
    } catch (err) {
        console.error(err)
        res.status(500).send('Error loading cart')
    }
}

const updateCart = async (req, res) => {
    try {
        const userId = req.user._id
        const quantities = req.body.quantities
        let cart = await Cart.findOne({ userId })
        if (!cart)
            return res.redirect('/cart')

        cart.items.forEach(item => {
            if (quantities[item.productId]) {
                item.quantity = parseInt(quantities[item.productId.toString()]) || 1
            }
        })

        await cart.save()
        res.redirect('/cart')
    } catch (err) {
        console.error('Error on updating', err)
        res.status(500).send('Server Error')
    }
}

const removefromCart = async (req, res) => {
    try {
        const userId = req.user._id
        const productId = req.params.id
        await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } })
        res.redirect('/cart')
    } catch (err) {
        console.error('Error on removing items from cart', err)
        res.status(500).send('Server Error')
    }
}

const loadCheckout = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId) // session user

    const cart = await Cart.findOne({ userId }).populate('items.productId') || { items: [] }

    const total = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0)

    const coupons = await Coupon.find({ active: true, expiredOn: { $gt: new Date() } })

    // Store cart and user data in session
    req.session.cartTotal = total

    res.render('user/checkout', {
      user,
      addresses: user.addresses || [],
      cart,
      total,
      coupons,
      selectedAddressIndex: 0,
      isLoggedIn: true
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Server Error')
    res.redirect('/cart')
  }
}

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body
        const userId = req.user._id
        const cart = await Cart.findOne({ userId }).populate('items.productId')
        if (!cart || cart.items.length === 0)
            return res.status(404).json({ success: false, message: 'Cart is empty' })
        let total = cart.items.reduce((sum, item) => sum + item.productId.price * item.quantity, 0)
       
        let discount = 0
        let finalTotal = total
        let appliedCoupon = null
        let error = ''

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                active: true,
                expiredOn: { $gt: new Date() }
            })

            if (!coupon) {
                error = 'Invalid or expired coupon'
            }else if (coupon.usedBy.some(u => u.toString() === userId.toString())) {
        error = 'You have already used this coupon'
      } 
      else if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
        error = 'This coupon has reached its maximum usage limit'
      } 
      else {
                appliedCoupon = coupon
                discount = coupon.discountType === "percentage" ? (total * coupon.discountValue) / 100 : coupon.discountValue
                finalTotal = Math.max(total - discount,0)
            }
        }

        return res.json({
            success:!error,
            discount,
            finalTotal,
            appliedCoupon,
            error
        })
    } catch (err) {
        console.error('Error applying coupon', err)
        res.status(500).send('Server Error')
    }
}

const placeCheckout = async (req, res) => {
  try {
    const userId = req.user._id
    const { selectedAddress, couponCode, paymentMethod } = req.body

    const user = await User.findById(userId)
    if (!user) return res.redirect('/checkout')

    // Selected address
    const shippingAddress = user.addresses[selectedAddress]
    if (!shippingAddress)
      return res.redirect('/checkout?message=Select a valid address')

    // Cart
    const cart = await Cart.findOne({ userId }).populate('items.productId')
    if (!cart || cart.items.length === 0) return res.redirect('/cart')

    // Calculate totals
    let price = cart.items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0)
    let discount = 0
    let finalPrice = price
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
        expiredOn: { $gt: new Date() }
      })

      if (coupon && !coupon.usedBy.includes(userId.toString())) {
        discount = coupon.discountType === 'percentage'
          ? (coupon.discountValue / 100) * price
          : coupon.discountValue
        finalPrice = Math.max(price - discount, 0)
        appliedCoupon = coupon
      }
    }

    // Save session for Stripe
    req.session.userId = userId
    req.session.cartItems = cart.items.map(i => ({
      productId: i.productId._id,
      price: i.productId.price,
      quantity: i.quantity
    }))
    req.session.shippingAddress = shippingAddress
    req.session.couponCode = couponCode || null

    if (paymentMethod === 'Online') {
      // Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: 'Order Total' },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1
        }],
        success_url: `${req.protocol}://${req.get('host')}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout`
      })

      return res.redirect(session.url)
    }

    // COD Order
    const order = new Order({
      user: userId,
      products: req.session.cartItems,
      price,
      discount,
      finalPrice,
      address: shippingAddress,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      couponApplied: appliedCoupon ? appliedCoupon._id : null
    })

    await order.save()

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $addToSet: { usedBy: userId }
      })
    }

    // Clear cart
    await Cart.findOneAndDelete({ userId })
    req.session.cartItems = []
    req.session.shippingAddress = null
    req.session.couponCode = null

    const populatedOrder = await Order.findById(order._id)
      .populate('products.productId')
      .populate('user')

    sendOrderEmail(user.email, populatedOrder, 'Order Confirmed - Vespa Elegance')

    return res.render('user/order-summary', { order: populatedOrder,
        message: 'Your order has been confirmed!'
     })

      await generateInvoice(populatedOrder)

    return res.render('user/order-summary', {
      order: populatedOrder,
      message: 'Your order has been confirmed!',
    })

  } catch (err) {
    console.error('Error placing order', err)
    return res.redirect('/cart')
  }
}

const paymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.redirect('/checkout')

    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') return res.redirect('/checkout')

    const userId = req.session.userId
    const cartItems = req.session.cartItems || []
    const shippingAddress = req.session.shippingAddress
    const couponCode = req.session.couponCode || null

    if (!userId || !cartItems.length || !shippingAddress) {
      return res.redirect('/checkout')
    }

     const user = await User.findById(userId)
    if (!user) return res.redirect('/checkout')

    let price = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    let discount = 0
    let finalPrice = price
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
        expiredOn: { $gt: new Date() }
      })

      if (coupon && !coupon.usedBy.includes(userId.toString())) {
        discount = coupon.discountType === 'percentage'
          ? (coupon.discountValue / 100) * price
          : coupon.discountValue
        finalPrice = Math.max(price - discount, 0)
        appliedCoupon = coupon
      }
    }

    // Save order
    const order = new Order({
      user: userId,
      products: cartItems,
      price,
      discount,
      finalPrice,
      address: shippingAddress,
      paymentMethod: 'Online',
      paymentStatus: 'Paid',
      stripePaymentId: session.id,
      couponApplied: appliedCoupon ? appliedCoupon._id : null
    })

    await order.save()

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $addToSet: { usedBy: userId }
      })
    }

    await Cart.findOneAndDelete({ userId })
    req.session.cartItems = []
    req.session.shippingAddress = null
    req.session.couponCode = null

    const populatedOrder = await Order.findById(order._id)
      .populate('products.productId')
      .populate('user')

    sendOrderEmail(user.email, populatedOrder, 'Payment Successful - Order Confirmed')

    return res.render('user/order-summary', {
      order: populatedOrder,
      message: 'Payment successful! Your order is confirmed.'
    })

     await generateInvoice(populatedOrder)

    return res.render('user/order-summary', {
      order: populatedOrder,
      message: 'Payment successful! Your order is confirmed.',
    })

  } catch (err) {
    console.error('Payment success error', err)
    return res.redirect('/checkout')
  }
}

const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.userId; // session-based user ID
    if (!userId) return res.redirect('/login')

    const orderId = req.params.id
    const order = await Order.findOne({ _id: orderId, user: userId }).populate('user')

    if (!order) {
      return res.redirect('/myorders?message=Order not found&type=error')
    }

    if (order.orderStatus === 'Cancelled') {
      return res.redirect('/myorders?message=Order is already cancelled&type=info')
    }

    let newPaymentStatus= order.paymentMethod === 'Online' ? 'Paid' : 'Cancelled'
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'Cancelled',
      paymentStatus: newPaymentStatus
    })


    /* If the order was paid via online method, refund via Stripe
    if (order.paymentMethod === 'Online' && order.paymentStatus === 'Paid') {
      const session = await stripe.checkout.sessions.retrieve(order.stripePaymentId)

      if (!session.payment_intent) {
        console.error('missing payment_intent in stripe session')
        return res.redirect('/myorders?message=Unable to refund. Contact support&type=error')
      }

      // Issue refund
      await stripe.refunds.create({
        payment_intent: session.payment_intent,
      })
       newPaymentStatus = 'Refunded'

     const userEmail = order.user.email
      // Use your email service (nodemailer, etc.)
      await sendEmail({
        to: userEmail,
        subject: 'Refund Initiated for Your Order',
        html: `
          <p>Hello ${order.user.name},</p>
          <p>Your payment for order <b>${order._id}</b> has been refunded. It should reflect in your account within 2 business days.</p>
          <p>Thank you for cooperate with us.</p>
        `
      })

    } else {
      // For COD orders
      newPaymentStatus = 'Cancelled'
    }

    // Update order without triggering products validation
    await Order.findByIdAndUpdate(orderId, {
      orderStatus: 'Cancelled',
      paymentStatus: newPaymentStatus
    })   */

    return res.redirect('/myorders?message=Order cancelled successfully&type=success')
  } catch (err) {
    console.error('Error cancelling order:', err)
    return res.redirect('/myorders?message=Something went wrong&type=error')
  }
}

const loadBuyNowCheckout = async (req, res) => {
  try {
    const userId = req.user._id
    const { productId } = req.params

    const user = await User.findById(userId)
    if (!user) return res.redirect('/')

    const product = await Product.findById(productId)
    if (!product) return res.redirect('/')

    const coupons = await Coupon.find({ active: true, expiredOn: { $gt: new Date() } })

    res.render('user/buyNowCheckout', {
      user,
      product,
      addresses: user.addresses || [],
      selectedAddressIndex: 0,
      coupons,
      isLoggedIn: true
    })

  } catch (err) {
    console.error('Error loading Buy Now checkout:', err)
    res.redirect('/')
  }
}

const placeBuyNowOrder = async (req, res) => {
  try {
    const userId = req.user._id
    const { productId, selectedAddress, couponCode, paymentMethod } = req.body

    const user = await User.findById(userId)
    if (!user) return res.redirect('/')

    const product = await Product.findById(productId)
    if (!product) return res.redirect('/')

    const shippingAddress = user.addresses[selectedAddress]
    if (!shippingAddress) return res.redirect(`/buy-now/checkout/${productId}?error=Select valid address`)

    let price = product.price
    let discount = 0
    let finalPrice = price
    let appliedCoupon = null

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        active: true,
        expiredOn: { $gt: new Date() }
      })

      if (coupon && !coupon.usedBy.includes(userId.toString())) {
        appliedCoupon = coupon;
        discount = coupon.discountType === 'percentage'
          ? (price * coupon.discountValue) / 100
          : coupon.discountValue;
        finalPrice = Math.max(price - discount, 0)
      }
    }

    // Save Buy Now data in session
    req.session.buyNow = { productId, quantity: 1, price, finalPrice, shippingAddress, appliedCoupon }

    if (paymentMethod === 'Online') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: product.name },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1
        }],
        success_url: `${req.protocol}://${req.get('host')}/buy-now/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/buy-now/checkout/${productId}`
      })

      return res.redirect(session.url)
    }

    // COD Order
    const order = new Order({
      user: userId,
      products: [{ productId, price, quantity: 1 }],
      price,
      discount,
      finalPrice,
      address: shippingAddress,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      couponApplied: appliedCoupon ? appliedCoupon._id : null
    })

    await order.save()

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $addToSet: { usedBy: userId } })
    }

     const invoicePath = path.join(__dirname, `../public/invoices/invoice-${order._id}.pdf`)
    await generateInvoice(order, invoicePath)

    await sendOrderEmail(
      user.email,
      order,
      "Your Vespa Elegance Order Confirmation (COD)"
    )

    req.session.buyNow = null
    return res.render('user/order-summary', { order, message: 'Order placed successfully with COD',
      invoiceLink: `/invoices/invoice-${order._id}.pdf`
     })

  } catch (err) {
    console.error('Error placing Buy Now order:', err)
    res.redirect('/')
  }
}

const buyNowPaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.redirect('/')

    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.payment_status !== 'paid') return res.redirect('/')

    const buyNowData = req.session.buyNow
    if (!buyNowData) return res.redirect('/')

    const { productId, price, finalPrice, shippingAddress, appliedCoupon } = buyNowData

    let order = new Order({
      user: req.user._id,
      products: [{ productId, price, quantity: 1 }],
      price,
      discount: price - finalPrice,
      finalPrice,
      address: shippingAddress,
      paymentMethod: 'Online',
      paymentStatus: 'Paid',
      stripePaymentId: session.id,
      couponApplied: appliedCoupon ? appliedCoupon._id : null
    })

    await order.save()

    // populate product details for invoice and email
    order = await Order.findById(order._id)
      .populate('user')
      .populate('products.productId')

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $addToSet: { usedBy: req.user._id } })
    }

    // Generate invoice
    const invoicePath = path.join(__dirname, `../public/invoices/invoice-${order._id}.pdf`)
    await generateInvoice(order, invoicePath)

    // Send email confirmation
    await sendOrderEmail({
      to: order.user.email,
      order,
      subject: "Your Vespa Elegance Order Confirmation (Online Payment)",
      invoicePath,
    })

    req.session.buyNow = null

    return res.render('user/order-summary', { order, message: 'Payment successful! Your order is confirmed.',
       invoiceLink: `/invoices/invoice-${order._id}.pdf`
     })

  } catch (err) {
    console.error('Buy Now Payment Success Error:', err)
    res.redirect('/')
  }
}

const invoice = async (req, res) => {
  try {
    const userId = req.session.userId
    const orderId = req.params.id

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate('user')
      .populate('products.productId')

    if (!order) return res.status(404).json({ message: 'Order not found' })

    const filepath = path.join(__dirname, `../public/invoices/invoice-${orderId}.pdf`)
    await generateInvoice(order, filepath)

    res.redirect(`/invoices/invoice-${orderId}.pdf`)
  } catch (err) {
    console.error('Invoice generation failed:', err)
    res.status(500).json({ message: 'Server error generating invoice' })
  }
}

const sendOrderEmail = async (to, order, subject) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    })

     const itemsList = order.products
      .map(p => `<li>${p.productId?.name || "Unknown"} × ${p.quantity}</li>`)
      .join("")

     const date = new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

    const mailOptions = {
      from: `"Vespa Elegance" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      html: `
        <h2>Thank you for your order!</h2>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>Date:</b> ${date}</p>
        <ul>${itemsList}</ul>
        <p><b>Total:</b> ₹${order.finalPrice}</p>
         <p>You can download your invoice here:</p>
        <p><a href="${process.env.BASE_URL}/invoice/${order._id}" 
              target="_blank" 
              style="display:inline-block;padding:10px 16px;background:#007bff;color:#fff;text-decoration:none;border-radius:6px;">
              Download Invoice
           </a></p>
        <br>
        <p>— The Vespa Elegance Team 🛵</p>
      `
    }

    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", to);

  } catch (err) {
    console.error("Error sending email", err)
  }
}

/* const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, paymentId, status } = req.body

    const order = await Order.findOne({ orderId })
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    const allowedTransitions = {
      Pending: ["Paid", "Processing"],
      Paid: ["Processing"],
      Processing: ["Shipped"],
      Shipped: ["Delivered"],
      Delivered: ["Refunded"], // only delivered can be refunded
    }

    const currentStatus = order.paymentStatus

    if (
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).json({
        error: `Invalid status change from ${currentStatus} → ${status}`,
      })
    }

    // Prevent refund for COD
    if (status === "Refunded" && order.paymentMethod === "COD") {
      return res
        .status(400)
        .json({ error: "Refunds are not allowed for COD payments" })
    }

    // Stripe Refund if required
    if (status === "Refunded" && order.paymentMethod === "Stripe") {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
      await stripe.refunds.create({
        payment_intent: order.stripePaymentId,
      })
    }

    // Update safely
    order.paymentStatus = status
    if (paymentId) {
      order.stripePaymentId = paymentId
    }

    await order.save()

    res.status(200).json({
      success: true,
      message: "Payment Status Updated",
      paymentStatus: order.paymentStatus,
    })
  } catch (err) {
    console.error("Error updating payment status", err)
    res.status(500).json({ error: "Failed to update payment status" })
  }
}  */

const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId')
        res.render('user/wishlist', { wishlist })
    } catch (err) {
        console.error('Cannot load wishlist')
        res.status(500).send('Server Error')
    }
}

const addtoWishlist = async (req, res) => {
    try {

        const userId = req.user._id
        const productId = req.params.productId
        console.log('hai')
        console.log(userId, productId)

        if (!productId) {
            return res.redirect('/wishlist')
        }

        let wishlist = await Wishlist.findOne({ userId })
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] })
        }
        const exists = wishlist.products.find(p => p.productId.toString() === productId)
        if (exists) {
            return res.redirect('/wishlist')
        }

        wishlist.products.push({ productId })
        await wishlist.save()

        res.redirect('/wishlist')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}

const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user._id
        const productId = req.params.productId

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID missing' });
        }

        let wishlist = await Wishlist.findOne({ userId })
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] })
        }

        const existsIndex = wishlist.products.findIndex(
            p => p.productId.toString() === productId
        )

        let action;
        if (existsIndex > -1) {
            wishlist.products.splice(existsIndex, 1)   // Already in wishlist, remove it
            action = 'removed'
        } else {
            wishlist.products.push({ productId })   // Not in wishlist, add it
            action = 'added'
        }

        await wishlist.save()
        res.json({ success: true, action })

    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, message: 'Server Error' })
    }
}

const removefromWishlist = async (req, res) => {
    try {
        const userId = req.user._id
        const { productId } = req.params
        const wishlist = await Wishlist.findOne({ userId })
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' })
        }
        wishlist.products = wishlist.products.filter(p => p.productId.toString() !== productId)
        await wishlist.save()
        res.redirect('/wishlist')
    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}

const postRating = async (req, res) => {
    try {
        const { modelId, rating, review } = req.body
        const userId = req.user?._id
         if (!userId) 
            return res.status(401).json({ error: "User not authenticated" })

        const product = await Product.findById(modelId)
        if (!product) return res.status(404).send("Model not found")

             if (!Array.isArray(product.ratings)) product.ratings = []

     /*  product.ratings = product.ratings.map(r => {
         if (!r) return null
      if (typeof r === "number") return { userId: null, rating: r }
      return r
    }).filter(r => r !== null)   */
       
            const existingRating = product.ratings.find(r => r.userId?.toString() === userId.toString())    // Check if user already rated
        
            if (existingRating) {
               existingRating.rating = Number(rating) // update rating
                  if (review) existingRating.review = review
      existingRating.createdAt = new Date()
    }  else {
                product.ratings.push({ userId, rating:Number(rating), review })
            }


        await product.save() 
        const total = product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0)
        const avg = (total / product.ratings.length).toFixed(1)
      //  res.json({ success: true, averageRating: avg, totalRatings: product.ratings.length })

       res.json({ 
      success: true, 
      averageRating: avg, 
      totalRatings: product.ratings.length,
      reviews: product.ratings.map(r => ({
        userId: r.userId,
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt
      }))
    })
    } catch (err) {
        console.error('Error on postRating' , err)
        res.status(500).json({error:"Server error",details:err.message})
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
    profilePage,
    editProfilePage,
    updateProfile,
    uploadProfilePhoto,
    addAddress,
    getService,
    getOrders,
    getOrderDetails,
    cancelOrder,
    postFeedback,
    getFeedback,
    getModels,
    getModelDetails,
    addReview,
    addtoCart,
    getCart,
    updateCart,
    removefromCart,
    loadCheckout,
    applyCoupon,
    placeCheckout,
    paymentSuccess,
    invoice,
    sendOrderEmail,
    loadBuyNowCheckout,
    placeBuyNowOrder,
    buyNowPaymentSuccess,
    getWishlist,
    addtoWishlist,
    toggleWishlist,
    removefromWishlist,
    postRating
}