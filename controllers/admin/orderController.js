const Order=require('../../models/orderModel')

const getOrders=async(req,res)=>{
    try {
        const orders=await Order.find().populate('products.productId').populate('userId').sort({createdAt:-1})
        res.render('admin/orders',{orders})
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const viewDetails=async (req,res)=>{
    try {
      const order=await Order.findById(req.params.id).populate
      .populate('user')
      .populate('products.productId')  

      if(!order) 
        return res.status(404).send('Order not Found')
        
        res.render('admin/details',{order})
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const updateStatus= async (req,res)=>{
    try {
        const {status}=req.body
        await Order.findByIdAndUpdate(req.params.id,{status})
        res.redirect('/admin/orders')
    } catch (err) {
        res.status(500).send('Update Failed')
    }
}
 
const deleteOrder=async (req,res)=>{
    try {
        await Order.findByIdAndDelete(req.params.id)
        res.redirect('/admin/orders')
    } catch (err) {
        res.status(500).send('Delete Failed')
    }
}

const refundOrder = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'Refunded'
    })
    res.redirect(`/admin/orders/${req.params.id}`)
}catch(err){
    res.status(500).send('Refund Failed')
}
}


module.exports={
    getOrders,
    viewDetails,
    updateStatus,
    deleteOrder,
    refundOrder
}