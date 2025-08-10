const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
  },
  about: {
    trim: true, //Remove Trailing and Leading Spaces
    type: String,
  },
  contactNumber: {
    type: Number,
    trim: true,
  },
  dateOfBirth: {
    type: String,
  },
});

module.exports = mongoose.model("Profile", profileSchema);
