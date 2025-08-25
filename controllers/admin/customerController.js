const User=require('../../models/userModel')

const usersInfo=async (req,res)=>{
    try {
        let search=''
        if(req.query.search){
            search=req.query.search
        }
        let page=1
        if(req.query.page){
            page=req.query.page
        }
        const limit=3
        const userData=await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:'.*'+search+'.*'}},
                {email:{$regex:'.*'+search+'.*'}},
            ],
        })
        .sort({createdAt:-1})
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec()

        const count=await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:'.*'+search+'.*'}},
                {email:{$regex:'.*'+search+'.*'}},
            ],
        }).countDocuments()

        res.render('admin/users',{
            users:userData,
            search:search,
            page:page,
            limit:limit,
            totalPages:Math.ceil(count/limit)
        })
        
    } catch (error) {
        res.redirect('/admin/pageError')
     }
}

const blockUser =async (req,res)=>{
    try{
        const userId=req.params.id
        const user=await User.findById(userId)
        if(!user){
            return res.status(404).json({success:false,message:'User not found'})
        }
        user.isBlocked=!user.isBlocked
        await user.save()

        return res.json({
            success:true,
            message:`User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
        })
    }catch (err){
        console.log(err)
        res.status(500).json({success:false,message:'Server Error'})
    }
}



module.exports={
    usersInfo,
    blockUser
}