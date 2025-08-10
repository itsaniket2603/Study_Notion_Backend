const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const {passwordUpdated} = require("../mail/templates/passwordUpdate");

exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not registered",
      });
    }
    const token = crypto.randomUUID(); //generate random token or number
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true } //returns the new doc
    );
    const url = `http://localhost:2000/update-password/${token}`;
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link ${url}`
    );
    return res.status(200).json({
      success: true,
      message: "Email Sent Sucessfully",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: `Error in sending resetting password link ${err}`,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword} = req.body;
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords are not matching.",
      });
    }
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is Invalid",
      });
    }
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Token is Expired, please regenerate the token",
      });
    }
    console.log("f this")
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    console.log("fffff")
    //Send Password Sucessfully Updated Email
    const name = userDetails.firstName;
    const email= userDetails.email;
    await mailSender(
      email,
      "Password Reset Sucessfully | StudyNotion",
      passwordUpdated(email,name)
    );
    return res.status(200).json({
      success: true,
      message: "Password Reset Successfull",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: `${err}`,
    });
  }
};
