const Feedback=require('../../models/feedbackModel')

const getFeedback=async (req,res)=>{
    try {
        const messages=await Feedback.find().sort({createdAt:-1})
        res.render('admin/feedback',{messages})
    } catch (err) {
        console.error('Error loading feedback',err.message)
        res.status(500).send('Server Error')
    }
}

module.exports={
    getFeedback
}