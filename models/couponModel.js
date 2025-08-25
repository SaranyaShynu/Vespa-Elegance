const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        uppercase: true,
        unique: true
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
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    usedBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
    }

})

module.exports = mongoose.model('Coupon', couponSchema)