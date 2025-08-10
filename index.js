const express = require("express");
const app = express();
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payment");
const courseRoutes = require("./routes/Course");
const contactUsRoutes = require("./routes/ContactUs")
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect} = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
dotenv.config();
const PORT=process.env.PORT || 4000;
database.dbconnect();
app.use(express.json());  //middleware setup
app.use(cookieParser());  //middleware setup
app.use(
    cors({   //to entertain req from frontend
        origin:"http://localhost:2000" ,
        credentials:true,     
    })
)
app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp"
    })
)
cloudinaryConnect();
//mounting routes
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/course",courseRoutes);
app.use("/api/v1/reach",contactUsRoutes)
//Default Route
app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Server is UP and Running"
    })
})
app.listen(PORT,()=>{
    console.log(`App is running at ${PORT}`)
})