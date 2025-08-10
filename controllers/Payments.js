const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress")
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const mongoose = require("mongoose")
const crypto = require("crypto");
//initiate the razorpay order

exports.capturePayment = async(req, res) => {

    const {courses} = req.body;
    const userId = req.user.id;
    //validation
    if(courses.length === 0) {
        return res.json({success:false, message:"Please provide Course Id"});
    }

    let totalAmount = 0;//find total amount

    for(const course_id of courses) {
        let course;
        try{
           
            course = await Course.findById(course_id);
            if(!course) {
                return res.status(200).json({success:false, message:"Could not find the course"});
            }

            const uid  = new mongoose.Types.ObjectId(userId); //convert string to id
            if(course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({success:false, message:"Student is already Enrolled"});
            }

            totalAmount += course.price;
        }
        catch(error) {
            console.log("yooo" ,error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
    const currency = "INR";
    const options = {
        amount: totalAmount * 100, //necessary to *100 acc to docs
        currency,
        receipt: Math.random(Date.now()).toString(),
    }
    //create order
    try{
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success:true,
            message:paymentResponse,
        })
    }
    catch(error) {
        console.log("yoyoyoyo",error);
        return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
    }

}


//verify the payment
exports.verifyPayment = async(req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;
    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"Payment Failed"});
    }
    //Acc to Razorpay Docs
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.REACT_APP_RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

        if(expectedSignature === razorpay_signature) {
            //enroll the student 
            await enrollStudents(courses, userId, res);
            //return res
            return res.status(200).json({success:true, message:"Payment Verified"});
        }
        return res.status(200).json({success:"false", message:"Payment Failed"});

}


const enrollStudents = async(courses, userId, res) => {

    if(!courses || !userId) {
        return res.status(400).json({success:false,message:"Please Provide data for Courses or UserId"});
    }

    for(const courseId of courses) {
        try{
            //find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
            {_id:courseId},
            {$push:{studentsEnrolled:userId}},
            {new:true},
        )

        if(!enrolledCourse) {
            return res.status(500).json({success:false,message:"Course not Found"});
        }

        const courseProgress = await CourseProgress.create({
            courseID:courseId,
            userId:userId,
            completedVideos: [],
        })

        //find the student and add the course to their list of enrolledCOurses
        const enrolledStudent = await User.findByIdAndUpdate(userId,
            {$push:{
                courses: courseId,
                courseProgress: courseProgress._id,
            }},{new:true})
        const emailResponse = await mailSender(
            enrolledStudent.email,
            `Successfully Enrolled into ${enrolledCourse.courseName}`,
            courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
        )    
        //console.log("Email Sent Successfully", emailResponse.response);
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }

}

exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;
    const userId = req.user.id;
    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try{
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
             paymentSuccessEmail(`${enrolledStudent.firstName}`,amount/100,orderId, paymentId)
        )
    }
    catch(error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}



//This code was for Single Course

//Capture the payment and initiate the razorpay order  -1
// exports.capturePayment = async (req,res) =>{
//     const {course_id}=req.body;
//     const userId=req.user.id;
//     //validate id
//     if(!course_id){
//         return res.json({
//             success:false,
//             message:"Please provide valid Course ID"
//         })
//     }
//     //validate course
//     let course;
//     try {
//         course = await Course.findById(course_id);
//         if(!course){
//             return res.json({
//                 success:false,
//                 message:"Course Not Found"
//             })
//         }
//         //check if user didnt already paid for the course
//         const uid = new mongoose.Types.ObjectId(userId); //as userId was string, converted it to ID
//         if(course.studentsEnrolled.includes(uid)){
//             return res.json({
//                 success:false,
//                 message:"Student Already Enrolled"
//             })
//         }
//     } catch (error) {
//         return res.status(500).json({
//             success:false,
//             message:error.message
//         })
//     }
//     //create Order   -2
//     const amount = course.price;
//     const currency = "INR";
//     const options = {
//         amount : amount*100,
//         currency,
//         receipt : Math.random(Date.now()).toString(),//Optional
//         notes:{ //Optional
//             courseId:course_id,
//             userId,
//         }
//     }

//     try {
//         //init the payment
//         const paymentResponse = await instance.orders.create(options); //created Order
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail:course.thumbnail,
//             orderId:paymentResponse.id,
//             currency:"INR",
//             amount:paymentResponse.amount,
//         })
//     } catch (error) {
//         return res.json({
//             success:false,
//             message:"Could not initiate order"
//         })
//     }
// }

// //verify signature of razorpay and server
// exports.verifySignature = async (req,res) =>{
//     const webhookSecret="1234567890";
//     const signature=req.headers("x-razorpay-signature"); //signature coming from razorpay, and it is hashed 
//     const shasum = crypto.createHmac("sha256",webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex"); //at the end this will have the converted webhooksecret using HMAC
//     if(signature === digest){
//         console.log("Payment is Authorised");
//         //Perform Action
//         const {courseId, userId}= req.body.payload.payment.entity.notes;
//         try {
//             //enter user id in course inside students enrolled
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 {_id:courseId},
//                 {
//                     $push:{
//                         studentsEnrolled:userId,
//                     }
//                 },
//                 {new:true}
//             );
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Something Went Wrong"
//                 })
//             }
//             //enter course id in user id
//             const enrolledStudent = await User.findOneAndUpdate(
//                 {_id:userId},
//                 {
//                     $push:{
//                         courses:courseId,
//                     }
//                 },
//                 {new:true}
//             );
//             if(!enrolledStudent){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Something Went Wrong"
//                 })
//             }
//             //send confirmation mail
//             await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations | StudyNotion",
//                 courseEnrollmentEmail(enrolledCourse.courseName,enrolledStudent.firstName),
//             )
//             return res.status(200).json({
//                 success:true,
//                 message:"Signature Verified and Course Added"
//             })
//         } catch (error) {
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             })
//         }
//     }
//     else{
//         return res.status(400).json({
//             success:false,
//             message:"Invalid Request"
//         })
//     }
// }

// // Send Payment Success Email
// exports.sendPaymentSuccessEmail = async (req, res) => {
//     const { orderId, paymentId, amount } = req.body;
//     const userId = req.user.id;
//     if (!orderId || !paymentId || !amount || !userId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Please provide all the details" })
//     }
//     try {
//       const enrolledStudent = await User.findById(userId)
//       await mailSender(
//         enrolledStudent.email,
//         `Payment Received`,
//         paymentSuccessEmail(
//           `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
//           amount / 100,
//           orderId,
//           paymentId
//         )
//       )
//     } catch (error) {
//       console.log("error in sending mail", error)
//       return res
//         .status(400)
//         .json({ success: false, message: "Could not send email" })
//     }
// }
  