const Coupon=require('../../models/couponModel')

const getCoupon=async (req,res)=>{
    try {
        const coupons=await Coupon.find().sort({createdAt:-1})
        const error = req.query.error || null
        const success = req.query.success || null
        res.render('admin/coupons',{coupons,error,success})
    } catch (err) {
        console.error('Cannot get Coupon page',err.message)
        res.status(500).send('Server Error')
    }
}

const addCoupon=async (req,res)=>{
    try {
        const {code,discountType,discountValue,expiredOn}=req.body
        const exists=await Coupon.findOne({code:code.toUpperCase()})

        if(exists)
        {
            return res.redirect('/admin/coupons?error=exists')
        }
        const coupon=new Coupon({
            code:code.toUpperCase(),
            discountType,
            discountValue,
            expiredOn,
            usedBy:[]
        })
        await coupon.save()
        res.redirect('/admin/coupons?success=Coupon added successfully')
    } catch (err) {
        console.error('Add Coupon Error',err.message)
        res.redirect('/admin/coupons?error=Server Error')
    }
}

const deleteCoupon=async (req,res)=>{
    try {
        await Coupon.findByIdAndDelete(req.params.id)
        res.redirect('/admin/coupons')
    } catch (err) {
        console.error('Error in Delete Coupon',err.message)
        res.redirect('/admin/coupons')        
    }
}


module.exports={
    getCoupon,
    addCoupon,
    deleteCoupon
}