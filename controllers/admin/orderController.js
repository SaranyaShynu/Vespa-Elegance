const Order=require('../../models/orderModel')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const sendEmail = require("../../utils/sendEmail")

const getOrders=async(req,res)=>{
    try {
        const orders=await Order.find().populate('products.productId' , 'name price images').populate('user','name email').sort({createdAt:-1})
        const message = req.query.message || null
        const type = req.query.type || 'info'

    res.render('admin/orders', { orders, message, type })
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const viewDetails=async (req,res)=>{
    try {
      const order=await Order.findById(req.params.id)
      .populate('user','name email')
      .populate('products.productId','name price images')  

      if(!order) 
        return res.status(404).send('Order not Found')
        
        res.render('admin/details',{order})
    } catch (err) {
        res.status(500).send('Server Error')
    }
}

const updateStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) return res.status(404).send("Order not found")

    const allowedTransitions = {
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    }

    const currentStatus = order.orderStatus;

    if (                                               // Validate transition
      !allowedTransitions[currentStatus] ||
      !allowedTransitions[currentStatus].includes(orderStatus))
    {
      return res.status(400).send(`Invalid status change: ${currentStatus} → ${orderStatus}`)
    }
     let newPaymentStatus = order.paymentStatus

    if (orderStatus === "Delivered" && order.paymentMethod === "COD") {       // Handle COD auto-payment on delivery
      newPaymentStatus = "Paid"
    }

    if (orderStatus === "Cancelled") {                // if Cancelled, reset paymentStatus
       if (order.paymentMethod === "COD") {
    newPaymentStatus = "Cancelled"
  } else if (order.paymentStatus === "Paid") {
    newPaymentStatus = "Refunded"
  }
    }

     await Order.findByIdAndUpdate(req.params.id, {
      orderStatus,
      paymentStatus: newPaymentStatus,
    })
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
    const order = await Order.findById(req.params.id).populate("user")

    if (!order) {
      return res.status(404).send("Order not found")
    }

    if (order.paymentMethod !== "Online" || 
      order.paymentStatus !== "Paid" ||
      order.orderStatus !== "Cancelled") {
      return res.status(400).send("Refund not applicable for this order")
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripePaymentId)
    if (!session.payment_intent) {
      console.error("Stripe session missing payment_intent")
      return res.status(500).send("Unable to process refund")
    }

    await stripe.refunds.create({                              // Issue refund
      payment_intent: session.payment_intent,
    })

    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: "Refunded",
      orderStatus: "Cancelled",
    })

    await sendEmail({
      to: order.user.email,
      subject: "Refund Processed",
      html: `
        <p>Hello ${order.user.name},</p>
        <p>Your order <b>${order._id}</b> has been refunded successfully.</p>
        <p>The amount will reflect in your account within 2–5 business days.</p>
      `,
    })

    res.redirect(`/admin/orders/${order._id}`)
  } catch (err) {
    console.error("Refund failed:", err)
    res.status(500).send("Refund Failed")
  }
}


module.exports={
    getOrders,
    viewDetails,
    updateStatus,
    deleteOrder,
    refundOrder
}