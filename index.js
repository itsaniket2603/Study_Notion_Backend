const express = require("express");
const app = express();
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payment");
const courseRoutes = require("./routes/Course");
const contactUsRoutes = require("./routes/ContactUs");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

database.dbconnect();

app.use(express.json());  // middleware setup
app.use(cookieParser());  // middleware setup

// CORS setup with allowed origins
const allowedOrigins = [
   "http://localhost:2000",
  //  "https://personal-project-fg4k.vercel.app",
  // "https://personal-project-3amo.vercel.app",
  "https://personal-project-3amo.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like Postman or curl
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

cloudinaryConnect();

// Mounting routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/reach", contactUsRoutes);

// Default Route
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Server is UP and Running",
  });
});

app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});
