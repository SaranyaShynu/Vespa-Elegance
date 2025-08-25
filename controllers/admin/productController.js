const Product=require('../../models/productModel')

const loadProduct = (req, res) => {
  res.render("admin/add-product",{message:null})
};
  
const addProduct=async (req,res)=>{
    try{
        const{name,category,price,color,description} = req.body

        const imagePath=req.files.map(file=>file.filename)

        const product=new Product({
            name,
            category,
            price,
            color,
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
        const {name,price,color,description}=req.body
        const product=await Product.findById(req.params.id)
        if(!product){
            return res.status(404).send('Product not found')
        }
        product.name=name
        product.price=price
        product.color=color
        product.description=description

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