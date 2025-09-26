const jwt=require('jsonwebtoken')
const User=require('../models/userModel')

const userAuth=async (req,res,next)=>{
    try{
        const token=req.cookies.userToken
    if(!token){
        return res.redirect('/login')
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const user=await User.findById(decoded.userId).lean()
        
        if(user && !user.block){
            req.user=user

            return next()
        }else{
        return res.redirect('/login')
        }
    }catch(err){
            console.error('Error in user auth middleware',err.message)
            return res.redirect('/login')
        }
    }


const adminAuth=async (req,res,next)=>{
    try{
        const token=req.cookies.adminToken
        if(!token){
            return res.redirect('/admin/login')
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(decoded.isAdmin){
            req.admin=decoded
            return next()
        }else{
        return res.redirect('/admin/login')
    }
}catch(err){
            console.error('Error in admin auth middleware',err.message)
            res.clearCookie('adminToken')
            return res.redirect('/admin/login')
        }
}


module.exports={
    userAuth,
    adminAuth
}