const mongoose=require('mongoose')

const bannerSchema=new mongoose.Schema({
      image:{
        type:String,
        default:''
      }
})

module.exports=mongoose.model('Banner',bannerSchema)