const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    enrollmentNumber: { type: String, required: true, unique: true },
    department: { type: String },
    batch: { type: Number },
    score: {
      cgpa: { type: Number, min: 0, max: 10 },
      twelfthPercentage: { type: Number, min: 0, max: 100 },
      tenthPercentage: { type: Number, min: 0, max: 100 },
    },
    docs: {
      tenthMarksheet: { type: String },
      twelfthMarksheet: { type: String },
      resume: { type: String },
      semMarksheet: { type: String },
    },
    isActivated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;