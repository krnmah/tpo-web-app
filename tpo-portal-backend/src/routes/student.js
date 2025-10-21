const express = require('express');
const router = express.Router();
const path = require('path');

// models
const TempUser = require('../models/TempUser');
const Student = require('../models/Student');

// middlewares
const { upload } = require('../middleware/upload');

// utils
const { isPdf, isImage } = require('../utils/validators');
const { sendWelcomeEmail } = require('../utils/mailer');

require('dotenv').config();

// POST /api/student/complete?token=...
// use upload.fields to accept specific fields
const cpUpload = upload.fields([
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'twelfthMarksheet', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
  { name: 'semMarksheet', maxCount: 1},
]);

router.post('/complete-profile', cpUpload, async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      const err = new Error('Missing token');
      err.status = 400;
      err.clientMessage = 'Verification link is missing';
      return next(err);
    }
    const tempUser = await TempUser.findOne({token: token});
    if(!tempUser) {
      const error = new Error('Token invalid or expired');
      error.status = 401;
      error.clientMessage = 'Verification link is invalid or has expired';
      return next(error);
    }
    
    // extract fields from body
    const { name, email, enrollmentNumber, department, batch, cgpa, twelfthPer, tenthPer } = req.body;
    if (!name || !email || !enrollmentNumber || !department || !batch || !cgpa || !twelfthPer || !tenthPer) {
      const err = new Error('Missing fields');
      err.status = 400;
      err.clientMessage = 'Please provide enrollment number, department, cgpa, percentage and batch';
      return next(err);
    }
    
    // files
    const files = req.files || {};
    const requiredFiles = ['tenthMarksheet','twelfthMarksheet','resume','semMarksheet','profilePicture'];

    const missing = requiredFiles.filter(k => !Array.isArray(files[k]) || files[k].length === 0);
    if (missing.length) {
      const err = new Error('Missing files');
      err.status = 400;
      err.clientMessage = 'All files (marksheets, resume, profile picture) are required';
      return next(err);
    }
    
    // validate MIME / extension
    const t10 = files.tenthMarksheet[0];
    const t12 = files.twelfthMarksheet[0];
    const resume = files.resume[0];
    const semMarksheet = files.semMarksheet[0];
    const prof = files.profilePicture[0];
    
    if (!isPdf(t10) || !isPdf(t12) || !isPdf(resume) || !isPdf(semMarksheet)) {
      const err = new Error('Invalid file type');
      err.status = 400;
      err.clientMessage = 'Marksheet and resume must be PDF';
      return next(err);
    }
    
    if (!isImage(prof)) {
      const err = new Error('Invalid file type');
      err.status = 400;
      err.clientMessage = 'Profile picture must be an image';
      return next(err);
    }
    
    // safety: ensure email does not already exist
    const exists = await Student.findOne({ email: email });
    if (exists) {
      const err = new Error('Account already exists');
      err.status = 400;
      err.clientMessage = 'An account with this email already exists';
      return next(err);
    }

    // store record
    const student = await Student.create({
      name: name,
      email: email,
      password: tempUser.passwordHash,
      profilePicture: `/uploads/profilePicture/${enrollmentNumber}${path.extname(prof.originalname)}`,
      enrollmentNumber: enrollmentNumber,
      department: department,
      batch: Number(batch),
      score:{
        cgpa: Number(cgpa),
        twelfthPercentage: Number(twelfthPer),
        tenthPercentage: Number(tenthPer),
      },
      docs:{
        tenthMarksheet: `/uploads/tenthMarksheet/${enrollmentNumber}${path.extname(t10.originalname)}`,
        twelfthMarksheet: `/uploads/twelfthMarksheet/${enrollmentNumber}${path.extname(t12.originalname)}`,
        resume: `/uploads/resume/${enrollmentNumber}${path.extname(resume.originalname)}`,
        semMarksheet: `/uploads/semMarksheet/${enrollmentNumber}${path.extname(semMarksheet.originalname)}`,
      }
    });

    await TempUser.deleteOne({ token });
    // send welcome mail
    await sendWelcomeEmail(email, name);

    return res.status(200).json({ studentId: student.id });
  } catch (err) {
    const safeError = new Error();
    safeError.status = 500;
    safeError.clientMessage = 'Unable to complete profile. Please try again later.';
    return next(safeError);
  }
});

module.exports = router;
