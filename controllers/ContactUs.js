const mailSender = require("../utils/mailSender");
const {contactUsEmail} = require("../mail/templates/contactUs");

exports.contactUs = async (req,res)=>{
    try {
        const {countrycode,email,firstname,lastname,message,phoneNo} = req.body;
        await mailSender(
            email,
            "StudyNotion",
            contactUsEmail(email,firstname,lastname,message,phoneNo,countrycode)
        );
        return res.json({
            success: true,
            message: "Email send successfully",
          })
    } catch (error) {
        return res.json({
            success: false,
            message: "Something went wrong...",
            error:error.message
        })
    }
}