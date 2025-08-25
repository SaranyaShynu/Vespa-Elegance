const Category=require('../../models/categoryModel')

const loadCategory= async (req,res)=>{
    try{
         res.render('admin/category',{message:null})
    }catch(err){
        console.error('Error to load',err)
        res.render('admin/category',{message:'Something went wrong'})
    }
    
}

const addCategory=async (req,res)=>{
    try{
        const {name}=req.body
        if(!name || name.trim()==='') return res.render('admin/category', {message:'Category name Required'})

            const existing=await Category.findOne({name:name.trim()})
        if(existing) return res.render('admin/category',{message:'Already Exists'})
                

           const category=new Category({name:name.trim()})
           await category.save()
           return  res.redirect('/admin/products')
    } catch(err){
        console.error('Add category error',err)
        res.render('admin/category',{message:'Something went wrong'})
    }
}

const listCategory=async (req,res)=>{
    try{
        const categories=await Category.find({})
        res.render('admin/category',{categories})
    }catch(err){
        console.error('Add Category Error',err)
        res.render('admin/category',{message:'Could not fetch categories'})
    }
}


module.exports={
    loadCategory,
    addCategory,
    listCategory
}