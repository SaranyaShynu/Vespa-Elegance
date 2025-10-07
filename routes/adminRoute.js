const express=require('express')
const router=express.Router()
const adminController=require('../controllers/admin/adminController')
const customerController=require('../controllers/admin/customerController')
const categoryController=require('../controllers/admin/categoryController')
const productController=require('../controllers/admin/productController')
const orderController=require('../controllers/admin/orderController')
const couponController=require('../controllers/admin/couponController')
const feedbackController = require('../controllers/admin/feedbackController')
const chatController = require('../controllers/chatController')
const messageController=require('../controllers/admin/messageController')
const {userAuth,adminAuth}=require('../middlewares/auth')
const bannerController=require('../controllers/admin/bannerController')
const upload=require('../middlewares/multer')

router.get('/settings',bannerController.loadBanner)
router.post('/settings/banner', upload.single('bannerImage'), bannerController.uploadBanner)
router.post('/settings/banner/delete',bannerController.deleteBanner)

router.get('/add-product',productController.loadProduct)
router.post('/add-product/add',upload.array('images',5),productController.addProduct)

router.get('/products',productController.getProduct)
router.post('/products/edit/:id',upload.array('images',5),productController.editProduct)
router.post('/products/delete/:id',productController.deleteProduct)

router.get('/pageError',adminController.pageError)
router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminAuth, adminController.loadDashboard)
router.get('/logout', adminController.logout)

router.get('/users',adminAuth, customerController.usersInfo)
router.patch('/users/:id/block',adminAuth,customerController.blockUser)

router.get('/category/add',categoryController.loadCategory)
router.post('/category/add',adminAuth,categoryController.addCategory)
router.get("/category", categoryController.listCategory)

router.get('/orders',orderController.getOrders)
router.get('/orders/:id',orderController.viewDetails)
router.post('/orders/:id/status',orderController.updateStatus)
router.post('/orders/:id/delete',orderController.deleteOrder)
router.post('/orders/:id/refund',orderController.refundOrder)

router.get('/coupons',adminAuth,couponController.getCoupon)
router.post('/coupons/add',adminAuth,couponController.addCoupon)
router.get('/coupons/delete/:id',adminAuth,couponController.deleteCoupon)

router.get('/feedback',adminAuth,feedbackController.getFeedback)
router.post('/feedback/:id/response',adminAuth,feedbackController.respondFeedback)
router.get('/chat/history/:roomId',adminAuth,messageController.getChatHistory)
router.get('/chat/:userId',adminAuth,chatController.loadAdminChat)

router.get('/service',adminController.loadService)

module.exports=router