const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60,
  },
});
//(Study flow from AuthJS to Otpjs)
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email | StudyNotion",
      emailTemplate(otp)
    );
  } catch (err) {
    console.log("Error in Sending OTPMail " ,error);
  }
}
//Used PreHook as OTP sent and verified before entry in DB (written after schema and before export)
OTPSchema.pre("save", async function (next) {
  await sendVerificationEmail(this.email, this.otp);
  next();
});

module.exports = mongoose.model("Otp", OTPSchema);
