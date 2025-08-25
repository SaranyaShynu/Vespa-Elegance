const mongoose=require('mongoose')
const {v4:uuidv4}=require('uuid')


const addressSchema = new mongoose.Schema({
  name: String,
  street: String,
  city: String,
  state: String,
  country: String,
  zip: String,
  phone: String
}, { _id: false }) // prevent auto _id in sub-docs

const orderSchema=new mongoose.Schema({
    orederId:{
        type:String,
        default:uuidv4,
        unique:true
    },
    user:{type:mongoose.Schema.Types.ObjectId,
          ref:'User'
    },
    products:[{
            productId:{type:mongoose.Schema.Types.ObjectId,
            ref:'Product'},
            quantity:Number
        }],
    price:{
            type:Number,
            default:0
        },
    discount:{
        type:Number,
        required:true
    },
    address:addressSchema,
    alternativeAddress:addressSchema,
   /* invoiceDate:{
        type:Date
    },  */
    status:{
        type:String,
        default:'processing',
        enum:['Processing','Delivered','Refunded']
    },
    paymentMethod: {
         type: String
    },
    paymentStatus: {
         type: String
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:String,
        default:false
    }
})



module.exports=mongoose.model('Order',orderSchema)