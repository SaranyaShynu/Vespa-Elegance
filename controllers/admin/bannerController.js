const Banner=require('../../models/bannerModel')
const path=require('path')
const fs=require('fs')

const loadBanner=async (req,res)=>{
    try {
         const settings=await Banner.findOne()
         res.render('admin/settings',{settings})
    } catch (err) {
        console.error('Error loading setting page',err.message)
        res.status(500).send('Server Error')
    }
   
}

const uploadBanner=async (req,res)=>{
    try {
        const bannerPath='/images/' + req.file.filename     // Because 'public' is static

        let settings=await Banner.findOne()
        if(!settings){
            settings=new Banner({banners:[bannerPath]})
        }else{
            settings.banners.push(bannerPath)
        }
        await settings.save()
        res.redirect('/admin/settings')
    }catch (err) {
        console.error('Upload banner failed',err.message)
        res.redirect('/admin/settings?error=true')
    }
}

const deleteBanner=async (req,res)=>{
    try {
        const file=req.body.image
        const settings=await Banner.findOne()

        if(settings){
            settings.banners=settings.banners.filter(b=>b!==file)
            await settings.save()

            const filePath=path.join(__dirname,'..','public',file)
            fs.unlink(filePath,err=>{
                if(err) console.error('Failed to delete image',err.message)
            })
    } 
    res.redirect('/admin/settings')
}
    catch (err) {
        console.error('Delete banner error',err.message)
        res.redirect('/admin/settings?error=true')
    }
}


module.exports={
    loadBanner,
    uploadBanner,
    deleteBanner
}