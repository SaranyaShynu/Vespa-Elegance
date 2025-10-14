const multer=require ('multer')
const path=require('path')
const fs=require('fs')

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        let folder='public/images'

          if (req.url.includes('/banner')) {
      folder = 'public/banner';
    }
    fs.mkdirSync(folder,{recursive:true})
    cb(null,folder)   //exist folder
},
    filename:(req,file,cb)=>{
        const uniqueName=Date.now() + path.extname(file.originalname)
        cb(null,uniqueName)
    }
})

/*const upload=multer({
    storage:storage,
    limits:{filesize:5 * 1024 * 1024},
    fileFilter:(req,file,cb)=>{
        const fileTypes=/jpg|png|jpeg/
        const extname=fileTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype=fileTypes.test(file.mimetype)

        if(extname && mimetype){
            cb(null,true)
        } else{
            cb(new Error('Only images allowed'))
        }
    }
}) */

    const upload = multer({ storage })


module.exports=upload