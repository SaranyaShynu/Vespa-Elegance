const mongoose=require('mongoose')

const feedbackSchema=new mongoose.Schema({
    user:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:false
    },
    name:String,
    email:String,
    message:{
        type:String,
        required:true
    },
    response: { type: String, default: "" },
   
}, {timestamps:true})

module.exports=mongoose.model('Feedback',feedbackSchema)