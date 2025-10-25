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

// Controllers
const { loginStudent, registerStudent, verify } = require("../controllers/authController");

require('dotenv').config();

// POST /api/auth/register
router.post('/register', registerStudent);

// GET /api/auth/verify?token=...
// This endpoint is used by frontend to check token validity
router.get('/verify', verify);

router.post("/login", loginStudent);

module.exports = router;