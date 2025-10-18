const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../config/prismaClient');
const { upload } = require('../middleware/upload');
const { isPdf, isImage } = require('../utils/validators');
const { sendWelcomeEmail } = require('../utils/mailer');
const path = require('path');

require('dotenv').config();

// POST /api/student/complete?token=...
// use upload.fields to accept specific fields
const cpUpload = upload.fields([
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'twelfthMarksheet', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'profilePicture', maxCount: 1 },
]);

router.post('/complete', cpUpload, async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      const err = new Error('Missing token');
      err.status = 400;
      err.clientMessage = 'Verification link is missing';
      return next(err);
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const error = new Error('Token invalid or expired');
      error.status = 401;
      error.clientMessage = 'Verification link is invalid or has expired';
      return next(error);
    }

    // extract fields from body
    const { enrollmentNumber, department, batch } = req.body;
    if (!enrollmentNumber || !department || !batch) {
      const err = new Error('Missing fields');
      err.status = 400;
      err.clientMessage = 'Please provide enrollment number, department, and batch';
      return next(err);
    }

    // files
    const files = req.files || {};
    if (!files.tenthMarksheet || !files.twelfthMarksheet || !files.resume || !files.profilePicture) {
      const err = new Error('Missing files');
      err.status = 400;
      err.clientMessage = 'All files (marksheets, resume, profile picture) are required';
      return next(err);
    }

    // validate MIME / extension
    const t10 = files.tenthMarksheet[0];
    const t12 = files.twelfthMarksheet[0];
    const resume = files.resume[0];
    const prof = files.profilePicture[0];

    if (!isPdf(t10) || !isPdf(t12) || !isPdf(resume)) {
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
    const exists = await prisma.student.findUnique({ where: { email: payload.email } });
    if (exists) {
      const err = new Error('Account already exists');
      err.status = 400;
      err.clientMessage = 'An account with this email already exists';
      return next(err);
    }

    // store record
    const student = await prisma.student.create({
      data: {
        name: payload.name,
        enrollmentNumber,
        email: payload.email,
        password: payload.hashedPassword,
        department,
        batch: Number(batch),
        tenthMarksheet: `/uploads/tenthMarksheet/${enrollmentNumber}${path.extname(t10.originalname)}`,
        twelfthMarksheet: `/uploads/twelfthMarksheet/${enrollmentNumber}${path.extname(t12.originalname)}`,
        resume: `/uploads/resume/${enrollmentNumber}${path.extname(resume.originalname)}`,
        profilePicture: `/uploads/profilePicture/${enrollmentNumber}${path.extname(prof.originalname)}`,
        isActivated: true,
      },
    });

    // send welcome mail
    await sendWelcomeEmail(payload.email, payload.name);

    return res.status(200).json({ studentId: student.id });
  } catch (err) {
    const safeError = new Error();
    safeError.status = 500;
    safeError.clientMessage = 'Unable to complete profile. Please try again later.';
    return next(safeError);
  }
});

module.exports = router;
