const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

exports.createRatingAndReview = async (req,res)=>{
    try {
        const userId = req.user.id;
        const {rating , review, courseId}=req.body;
        const courseDetails = await Course.findById(courseId);
        //check if course exists or not
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Course not found"
            })
        }
        //check if student enrolled or not
        if(!courseDetails.studentsEnrolled.includes(userId)){
            return res.status(400).json({
                success:false,
                message:"User is not enrolled in course"
            })
        }
        //check if user already given review
        if(courseDetails.ratingAndReviews.includes(userId)){
            return res.status(400).json({
                success:false,
                message:"Already rated the course"
            })
        }
        //if not then give rating and review
        const ratingReview = await RatingAndReview.create({rating,review,user:userId,course:courseId});
        //and also update it in Course
        await Course.findByIdAndUpdate(
            {_id:courseId},
            {
                $push:{
                    ratingAndReviews:ratingReview._id,
                }
            },
            {new:true}
        )
        return res.status(200).json({
            success:true,
            message:"Rated and Reviewd Successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Cannot rate and review"
        })
    }
}

exports.getAverageRatingAndReview = async (req,res)=>{
    try {
        const {courseId}=req.body;
        //calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(courseId), //all course with given courseId in ratingandreview collection
                },
            },
            {
                $group:{
                    _id:null, //all entries wrapped in a single group that came after matching
                    averageRating:{ $avg : "$rating"} //found avg of all the rating
                }
            }
        ])
        //if rating exists
        if(result.length>0){
            return res.status(200).json({
                success:true,
                averageRating:result[0].averageRating,
            })
        }
        //if no rating exists
        return res.status(200).json({
            success:true,
            message:"No rating as of now",
            averageRating:0,
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.getAllRating = async (req,res)=>{
    try {
        const allRatingAndReview = await RatingAndReview.find({})
        .sort({rating:"desc"})
        .populate({
            path:"user",
            select:"firstName lastName email image"       //only give me this data when populating
        })
        .populate({
            path:"course",
            select:"courseName"
        }).exec();
        return res.status(200).json({
            success:true,
            message:"All rating and review fetched sucessfully",
            allRatingAndReview
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
