const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        uppercase: true,
        unique: true,
        trim:true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiredOn: {
        type: Date,
        required: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min:1
    },
    active: {
        type: Boolean,
        default: true
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
maxUses: {
  type: Number,
  default: null // null = unlimited
},
usageCount: {
  type: Number,
  default: 0
}

},{timestamps:true})

module.exports = mongoose.model('Coupon', couponSchema)