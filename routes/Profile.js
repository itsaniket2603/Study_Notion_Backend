const express = require("express")
const router = express.Router()
const { auth, isInstructor } = require("../middleware/auth")
const {
  deleteAccount,
  updateProfile,
  updateDisplayPicture,
  getUserDetails,
  getEnrolledCourses,
  instructorDashboard
} = require("../controllers/Profile")

// Delete User Account
router.delete("/deleteProfile", auth, deleteAccount)
router.put("/updateProfile", auth, updateProfile)
router.put("/updateDisplayPicture", auth, updateDisplayPicture)
router.get("/getUserDetails",auth,getUserDetails)
router.get("/getEnrolledCourses", auth, getEnrolledCourses)
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)
module.exports = router