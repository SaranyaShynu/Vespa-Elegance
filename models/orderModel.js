const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')


const addressSchema = new mongoose.Schema({
    name: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    phone: String
}, { _id: false }) // prevent auto _id in sub-docs

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: ()=>uuidv4(),
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        price:{
            type:Number,
            required:true
        },
        quantity: { type: Number, default: 1 }
    }],
    price: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        default: 0
    },
    address: addressSchema,
    alternativeAddress: addressSchema,
    /* invoiceDate:{
         type:Date
     },  */
    orderStatus: {
        type: String,
        default: 'Processing',
        enum: ['Processing', 'Delivered', 'Shipped' , 'Cancelled']
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Stripe'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid' , 'Refunded' , 'Cancelled' ],
        default: 'Pending'
    },
    stripePaymentId: { type: String, default: null },
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
})



module.exports = mongoose.model('Order', orderSchema)