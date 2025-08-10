const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
    const info = transporter.sendMail({
      from: "StudyNotion by ANSH",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = mailSender;
