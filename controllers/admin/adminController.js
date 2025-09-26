const Admin = require('../../models/adminModel')
const User=require('../../models/userModel')
const Category = require('../../models/categoryModel')
const Product = require('../../models/productModel')
const Order = require('../../models/orderModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const pageError=async (req,res)=>{
  res.render('admin/pageError')
}


const loadLogin = async (req, res) => {
    try {
        const token = req.cookies.adminToken
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            if (decoded && decoded.isAdmin) {
                return res.redirect('/admin/dashboard')
            }
        } res.render('admin/login',{message: null })
    } catch (err) {
        return res.render('admin/login', { message: null })
    }
}


const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.render("admin/login", { message: "Email and password are required" })
    }

    // find admin
    const admin = await Admin.findOne({ email, isAdmin: true })
    if (!admin) {
      return res.render("admin/login", { message: "Invalid credentials" })
    }

    // compare password
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid credentials" })
    }

    // sign JWT
    const token = jwt.sign(
      { userId: admin._id, name: admin.name, email: admin.email, isAdmin: true,role:'admin'},
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    // set cookies
    res.cookie("adminToken", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect("/admin/dashboard")
  } catch (error) {
    console.error("Admin Login Error:", error)
    return res.render("admin/login", { message: "Something went wrong, try again later" })
  }
}

const loadDashboard= async (req,res)=>{
    try{
    
      if(!req.admin){
        return res.redirect('/admin/login')
      }

    const productCount = await Product.countDocuments()
    const orderCount = await Order.countDocuments()
    const userCount = await User.countDocuments()

    const sales=await Order.aggregate([
      {$match:{paymentStatus:'paid'}},
      {$group:{
        _id:{$month:'$createdAt'},
        total:{$sum:'$totalAmount'}
      }},
      {$sort:{'_id':1}}
    ])
    
    const salesData=Array(12).fill(0)
    sales.forEach((item)=>{
          salesData[item._id-1]=item.total
    })

    const salesLabel = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const orderCategory=await Order.aggregate([
      {$unwind:'$items'},
      {
        $lookup:{
          from:'products',
          localField:'items.productId',
          foreignField:'_id',
          as:'product'
        }
      },
       { $unwind:'$product'},
       {
        $lookup:{
          from:'categories',
          localField:'product.category',
          foreignField:'_id',
          as:'category'
        }
       },
       {$unwind:'$category'},
       {
        $group:{
          _id:'$category.name',
          count:{$sum:'$items.quantity'}
        }
       }
    ])

    const categoryLabels=orderCategory.map(item=>item._id)
    const categoryCounts=orderCategory.map(item=>item.count)


    res.render('admin/dashboard',{
      adminName:req.admin?.name,
      productCount,
      orderCount,
      userCount,
      salesLabel,
      salesData: JSON.stringify(salesData),
      orderCategoryData: JSON.stringify({ labels: categoryLabels, data: categoryCounts}),
    })
  
    }catch(err){
      console.error('Dashboard load error',err.message)
      res.redirect('/admin/pageError')
    }
  }


const logout= async (req,res)=>{
  try{
       res.clearCookie('adminToken')
       res.clearCookie('welcome_message')

       return res.redirect('/admin/login')
  }catch(err){
    console.error('Admin logout error')
   return res.redirect('/admin/pageError')
  }
}

const loadService=(req,res)=>{
 res.render('admin/service')
}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout,
    loadService
}

