const Product=require('../../models/productModel')

const loadProduct = (req, res) => {
  res.render("admin/add-product",{message:null})
}
  
const addProduct=async (req,res)=>{
    try{
        const{name,category,subCategory,price,color,description} = req.body

          const colorsArray = color
      ? Array.isArray(color)
      ? color
      : color.split(',').map(c => c.trim())
      :[]

        const imagePath= req.files ? req.files.map(file=>file.filename) : []

        const product=new Product({
            name,
            category,
            subCategory,
            price,
            color: colorsArray,
            description,
            images:imagePath,
            status:'Available'
        })

        await product.save()
        res.render('admin/add-product',{message:'Product added Successfully!'})
    } catch(err){
        console.error('Error adding products',err)
        res.render('admin/add-product',{message:'Error adding product'})
    }
}

const getProduct=async (req,res)=>{
    try {
        const product=await Product.find({})
        const success=req.query.success||null
        const error=req.query.error||null
        res.render('admin/products',{product,success,error})
    } catch (err) {
        res.status(500).send('Server error')
    }
}

const editProduct=async (req,res)=>{
    try {
        const {name,price,color,description,subCategory}=req.body
        const product=await Product.findById(req.params.id)
        if(!product){
            return res.status(404).send('Product not found')
        }
        product.name=name
        product.price=price
        product.color=Array.isArray(color)
      ? color
      : color.split(',').map(c => c.trim())
        product.description=description
        product.subCategory = subCategory || product.subCategory

          // 🔹 Handle existing images
    let remainingImages = []
    if (req.body.existingImages) {
      remainingImages = JSON.parse(req.body.existingImages)
    }
    product.images = remainingImages
        if (req.files && req.files.length > 0) {
    product.images = [...
        remainingImages,...req.files.map(file=>file.filename)]
}

        await product.save()
        res.redirect('/admin/products')
    } catch (err) {
        console.error('Error in updation',err)
        res.status(500).send('Server error')
    }
}

const deleteProduct=async (req,res)=>{
    try {
        await Product.findByIdAndDelete(req.params.id)
        res.redirect('/admin/products')
    } catch (err) {
        console.error('Error to delete',err)
        res.status(500).send('Server Error')
    }
}

module.exports={loadProduct,
    addProduct,
    getProduct,
    editProduct,
    deleteProduct
}