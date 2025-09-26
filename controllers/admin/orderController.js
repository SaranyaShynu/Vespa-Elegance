const Order=require('../../models/orderModel')

const getOrders=async(req,res)=>{
    try {
        const orders=await Order.find().populate('products.productId').populate('user','name email').sort({createdAt:-1})
        res.render('admin/orders',{orders})
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const viewDetails=async (req,res)=>{
    try {
      const order=await Order.findById(req.params.id)
      .populate('user','name email')
      .populate('products.productId','name price image')  

      if(!order) 
        return res.status(404).send('Order not Found')
        
        res.render('admin/details',{order})
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) return res.status(404).send("Order not found")

    const allowedTransitions = {
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    }

    const currentStatus = order.status;

    if (                                               // Validate transition
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(status)
    ) {
      return res.status(400).send(`Invalid status change: ${currentStatus} → ${status}`)
    }
    order.status = status

    if (status === "Delivered" && order.paymentMethod === "COD") {       // Handle COD auto-payment on delivery
      order.paymentStatus = "Paid"
    }

    if (status === "Cancelled") {                // if Cancelled, reset paymentStatus
      order.paymentStatus = "Cancelled"
    }

    await order.save()
    res.redirect("/admin/orders")
  } catch (err) {
    console.error("Error in updateStatus:", err)
    res.status(500).send("Update Failed")
  }
}
 
const deleteOrder=async (req,res)=>{
    try {
        await Order.findByIdAndDelete(req.params.id)
        res.redirect('/admin/orders')
    } catch (err) {
        console.error("Delete order failed:", err.message)
        res.status(500).send('Delete Failed')
    }
}

const refundOrder = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'Refunded',
      status:'Refunded'
    })
    res.redirect(`/admin/orders/${req.params.id}`)
}catch(err){
    console.error("Refund failed:", err.message)
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