const Course = require("../models/Course");
const Category = require("../models/Category");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { courseName, courseDescription, whatYouWillLearn, price, category } = req.body;
    const thumbnail = req.files?.thumbnailImage;

    if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);
    if (!instructorDetails) return res.status(404).json({ success: false, message: "Instructor not found" });

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) return res.status(404).json({ success: false, message: "Category not found" });

    const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME, 1000, 1000);

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
    });

    await User.findByIdAndUpdate(instructorDetails._id, { $push: { courses: newCourse._id } });
    await Category.findByIdAndUpdate(categoryDetails._id, { $push: { courses: newCourse._id } });

    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Course addition failed", error: err.message });
  }
};

// Get all courses (limited fields)
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find({}, {
      courseName: 1,
      price: 1,
      thumbnail: 1,
      instructor: 1,
      ratingAndReviews: 1,
      studentsEnrolled: 1,
    }).populate("instructor").exec();

    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully",
      data: allCourses,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Get detailed course info for course page
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })
      .exec();

    if (!courseDetails) {
      return res.status(400).json({ success: false, message: `No course found with id: ${courseId}` });
    }

    return res.status(200).json({ success: true, data: { courseDetails } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get full course details for enrolled student
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })
      .exec();

    if (!courseDetails) {
      return res.status(400).json({ success: false, message: `No course found with id: ${courseId}` });
    }

    let courseProgress = await CourseProgress.findOne({ courseID: courseId, userId });

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach(section => {
      section.subSection.forEach(sub => {
        totalDurationInSeconds += parseInt(sub.timeDuration || "0");
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgress?.completedVideos || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Edit course info
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (req.files?.thumbnailImage) {
      const thumbnailImage = await uploadImageToCloudinary(req.files.thumbnailImage, process.env.FOLDER_NAME);
      course.thumbnail = thumbnailImage.secure_url;
    }

    for (const key in updates) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        if (key === "tag" || key === "instructions") {
          try {
            course[key] = JSON.parse(updates[key]);
          } catch (err) {
            return res.status(400).json({
              success: false,
              message: `Invalid JSON in field '${key}'`,
            });
          }
        } else {
          course[key] = updates[key];
        }
      }
    }

    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate({ path: "instructor", populate: { path: "additionalDetails" } })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({ path: "courseContent", populate: { path: "subSection" } })
      .exec();

    res.json({ success: true, message: "Course updated successfully", data: updatedCourse });
  } catch (error) {
    console.error("Edit Course Error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// Get all courses of an instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructorCourses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: instructorCourses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

// Delete course by ID
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const studentsEnrolled = course.studentsEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } });
    }

    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId);
      if (section) {
        for (const subSectionId of section.subSection) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }
      await Section.findByIdAndDelete(sectionId);
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// ✅ GET COURSE PROGRESS PERCENTAGE
exports.getProgressPercentage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    const totalVideos = courseProgress.totalVideos || 0;
    const completedVideos = courseProgress.completedVideos?.length || 0;

    if (totalVideos === 0) {
      return res.status(200).json({
        success: true,
        progressPercentage: 0,
        message: "No videos to track progress",
      });
    }

    const progressPercentage = Math.round((completedVideos / totalVideos) * 100);

    return res.status(200).json({
      success: true,
      progressPercentage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while fetching course progress",
      error: error.message,
    });
  }
};
