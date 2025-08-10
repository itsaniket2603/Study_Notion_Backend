const mongoose = require("mongoose");
const ratingAndReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
    trim:true
  },
  course: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Course",
		index: true, //indicates that an index should be created on the course field for faster querying.
	},
});

module.exports=mongoose.model("RatingAndReview",ratingAndReviewSchema);