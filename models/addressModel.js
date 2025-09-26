const mongoose=require('mongoose')
const addressSchema=new mongoose.Schema({
    userId:{
       type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},
address:[{
    addressType:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    street:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    zip:{
        type:Number,
        required:true
    },
    mobile:{
        type:String,
        required:true
    }
}]
})


module.exports=mongoose.model('Address',addressSchema)