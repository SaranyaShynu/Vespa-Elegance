const Feedback=require('../../models/feedbackModel')

const getFeedback=async (req,res)=>{
    try {
        const messages=await Feedback.find().populate('user').sort({createdAt:-1})
        res.render('admin/feedback',{messages})
    } catch (err) {
        console.error('Error loading feedback',err.message)
        res.status(500).send('Server Error')
    }
}

const respondFeedback = async (req, res) => {
  try {
    const { id } = req.params        // feedback id
    const { response } = req.body

    await Feedback.findByIdAndUpdate(id, { response })
    res.redirect('/admin/feedback')
  } catch (err) {
    console.error('Error responding to feedback:', err.message)
    res.status(500).send('Server Error')
  }
}

module.exports={
    getFeedback,
    respondFeedback
}