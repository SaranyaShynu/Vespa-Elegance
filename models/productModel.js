const mongoose=require('mongoose')
const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    category:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    color:{
        type:String,
        trim:true
    },
    images:{
        type:[String],
        required:true
    },
    status:{
        type:String,
        enum:['Available','Out of stock'],
        default:'Available'
    },
    createdAt: {
    type: Date,
    default: Date.now
    }
})



module.exports=mongoose.model('Product',productSchema)