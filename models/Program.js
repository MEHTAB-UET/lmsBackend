const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
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
programSchema.index({ code: 1 });
programSchema.index({ department: 1 });

// Add validation for unique program code
programSchema.pre("save", async function (next) {
  if (this.isModified("code")) {
    const existingProgram = await this.constructor.findOne({
      code: this.code,
      _id: { $ne: this._id },
    });
    if (existingProgram) {
      next(new Error("Program code already exists"));
    }
  }
  next();
});

const Program = mongoose.model("Program", programSchema);

module.exports = Program;
