const mongoose = require("mongoose");

const courseSchema = mongoose.Schema({
  courseName: {
    type: String,
    trim:true
  },
  courseDescription: {
    type: String,
    trim:true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  whatYouWillLearn: {
    type: String,
    trim:true
  },
  courseContent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    }
  ],
  ratingAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatingAndReview",
    },
  ],
  price: {
    type: Number,
    trim:true
  },
  thumbnail: {
    type: String,
  },
  category: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Category"
  },
  studentsEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
  status: {
		type: String,
		enum: ["Draft", "Published"],
	},
  createdAt: {
		type:Date,
		default:Date.now
	},
});

module.exports = mongoose.model("Course", courseSchema);
