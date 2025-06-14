const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    credits: {
      type: Number,
      required: [true, "Number of credits is required"],
      min: [1, "Credits must be at least 1"],
      max: [6, "Credits cannot exceed 6"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester cannot exceed 8"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1 });

// Add validation for unique course code
courseSchema.pre("save", async function (next) {
  if (this.isModified("code")) {
    const existingCourse = await this.constructor.findOne({
      code: this.code,
      _id: { $ne: this._id },
    });
    if (existingCourse) {
      next(new Error("Course code already exists"));
    }
  }
  next();
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
