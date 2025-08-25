const mongoose=require('mongoose')
const userSchema=new mongoose.Schema({
    name:{type:String
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:false,
    },
    mobileno:{
        type:String,
        required:false,
        unique:true,
        sparse:true,
        default:null
    },
    googleId:{
         type:String,
         unique:true,
         sparse:true
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    otp: String,
    otpExpires: Date,
    cart:[{
         type:mongoose.Schema.Types.ObjectId,
         ref:"Cart"
    }],
    wishlist:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Wishlist"
    }],
    orderHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now

    },
    referalCode:{
        type:String,
      //  required :true
    },
    redeemed:{
        type:Boolean,
       // default:false
    },
    redeemedUsers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
       // required: true
    }],
    searchHistory:[{
        category:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Category"
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
    }],
    profilePic:{type:String},
    resetOtp: Number,
    otpExpires: Date

},{timestamps:true})

module.exports=mongoose.model('User',userSchema)