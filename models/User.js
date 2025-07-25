const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  role: {
    type: String,
    default: "student",
  },
  department: String,
  program: String,
  semester: Number,
  cgpa: Number,
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "active",
  },
  // Faculty specific fields
  designation: String,
  qualification: String,
  assignedCourses: [
    {
      courseCode: String,
      courseName: String,
      credits: Number,
      semester: Number,
    },
  ],
  // Student specific fields
  enrolledCourses: [
    {
      courseCode: String,
      courseName: String,
      semester: String,
      grade: String,
      credits: Number,
    },
  ],
  contactInfo: {
    phone: String,
    address: String,
  },
});

module.exports = mongoose.model("User", userSchema);
