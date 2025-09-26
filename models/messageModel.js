const mongoose=require('mongoose')

const messageSchema=new mongoose.Schema({
    roomId:{
        type:String,
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    content:{
        type:String,
        required:true
    },
    isFromAdmin:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})


module.exports=mongoose.model('Message',messageSchema)