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
    subCategory:{ 
        type: String,
        required: true,
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
        type:[String],
        required:true
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
    },
     ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, min: 1, max: 5, required: true },
      review: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }]
})

//⭐ Virtual for avg rating
productSchema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0
  const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0)
  return (sum / this.ratings.length).toFixed(1);
})

productSchema.set("toJSON", { virtuals: true })
productSchema.set("toObject", { virtuals: true }) 

module.exports=mongoose.model('Product',productSchema)