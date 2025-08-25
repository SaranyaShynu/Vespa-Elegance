const mongoose=require('mongoose')
require('dotenv').config()



const connectDB=async()=>{
    try{
         await mongoose.connect(process.env.MONGODB_URI,{
      //useNewUrlParser: true,
      //useUnifiedTopology: true,
    })
         console.log('DB Connected')
    }

    catch(err){
         console.log("DB Connection error", err.message)
         process.exit(1)
    }
}


module.exports=connectDB