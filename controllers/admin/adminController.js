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

const loadDashboard = async (req, res) => {
  try {
    if (!req.admin) {
      return res.redirect('/admin/login')
    }

    const productCount = await Product.countDocuments()
    const orderCount = await Order.countDocuments()
    const userCount = await User.countDocuments()

    res.render('admin/dashboard', {
      adminName: req.admin?.name || 'Admin',
      productCount,
      orderCount,
      userCount
    })
  } catch (err) {
    console.error('Dashboard load error', err.message)
    res.redirect('/admin/pageError')
  }
}

const getChartData = async (req, res) => {
  try {
    const filter = req.query.filter || 'monthly'

    let groupId, labelFormat

    if (filter === 'daily') {
      groupId = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" } }
      labelFormat = "%d %b"
    } else if (filter === 'yearly') {
      groupId = { year: { $year: "$createdAt" } }
      labelFormat = "%Y"
    } else {
      groupId = { month: { $month: "$createdAt" } }
      labelFormat = "%b"
    }

    //  Aggregate sales data
    const sales = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: groupId, total: { $sum: "$finalPrice" }, date: { $first: "$createdAt" } } },
      { $sort: { "_id": 1 } },
      {
        $project: {
          _id: 0,
          label: { $dateToString: { format: labelFormat, date: "$date" } },
          total: 1
        }
      }
    ])

    const salesLabel = sales.map(s => s.label)
    const salesData = sales.map(s => s.total)

    //  Order status pie chart
    const statusStats = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ])

    const statusLabels = statusStats.map(s => s._id)
    const statusData = statusStats.map(s => s.count)

    res.json({ salesLabel, salesData, statusLabels, statusData })
  } catch (err) {
    console.error("Error fetching chart data:", err)
    res.status(500).json({ message: "Error fetching chart data" })
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
    getChartData,
    pageError,
    logout,
    loadService
}

