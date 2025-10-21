const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// models
const Student = require('../models/Student');
const TempUser = require('../models/TempUser');

// utilities
const { sendVerificationEmail } = require('../utils/mailer');
const { isNitsriEmail } = require('../utils/validators');

require('dotenv').config();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const err = new Error('Missing required fields');
      err.status = 400;
      err.clientMessage = 'Please fill all fields';
      return next(err);
    }

    if (!isNitsriEmail(email)) {
      const err = new Error('Invalid email domain');
      err.status = 400;
      err.clientMessage = 'Email must be @nitsri.ac.in';
      return next(err);
    }

    const existing = await Student.findOne({ email });
    if (existing) {
      const err = new Error('Email already registered');
      err.status = 400;
      err.clientMessage = 'Account with this email already exists';
      return next(err);
    }

    const token = crypto.randomBytes(16).toString("hex");

    // Hash password before placing it in token for safety
    const hashed = await bcrypt.hash(password, 10);

    // Create a token with expiry 10 minutes
    await TempUser.create({
      name: name,
      email: email,
      passwordHash: hashed,
      token: token
    })

    // send mail asynchronously
    await sendVerificationEmail(email, token);

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    const safeError = new Error();
    safeError.status = 500;
    safeError.clientMessage = 'Unable to process request. Please try again later.';
    return next(safeError);
  }
});

// GET /api/auth/verify?token=...
// This endpoint is used by frontend to check token validity
router.get('/verify', async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      const err = new Error('No token provided');
      err.status = 400;
      err.clientMessage = 'Verification link is missing';
      return next(err);
    }

    const tempUser = await TempUser.findOne({token: token});
    if (!tempUser) {
      const error = new Error('Token invalid or expired');
      error.status = 401;
      error.clientMessage = 'Verification link is invalid or has expired';
      return next(error);
    }
    let message;
    if(tempUser.verified){
      message = "Email already verified. Fill details to complete registration.";
    }else{
      tempUser.verified = true;
      message = "Email Verified Successfully. Complete Profile!!!";
      await tempUser.save();
    }

    return res.status(200).json({
      valid: true,
      message: message,
      name: tempUser.name,
      email: tempUser.email
    });

  } catch (err) {
    const safeError = new Error();
    safeError.status = 500;
    safeError.clientMessage = 'Unable to verify link. Please try again later.';
    return next(safeError);
  }
});

module.exports = router;