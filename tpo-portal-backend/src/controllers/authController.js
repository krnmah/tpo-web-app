const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');

// models
const Student = require('../models/Student');
const TempUser = require('../models/TempUser');

// utilities
const { sendVerificationEmail } = require('../utils/mailer');
const { isNitsriEmail } = require('../utils/validators');

exports.loginStudent = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            const err = new Error('Missing required fields');
            err.status = 400;
            err.clientMessage = 'Please fill all fields';
            return next(err);
        }

        let user;
        if (role === "student") {
            user = await Student.findOne({ email });
        }
        else if (role === "crc") {
            user = await CRC.findOne({ email });
        }
        else if (role === "admin"){
            user = await Admin.findOne({ email });
        }
        else {
            const err = new Error('Invalid Role');
            err.status = 400;
            err.clientMessage = 'Invalid credentials';
            return next(err);
        }

        if (!user) {
            const err = new Error('User not found!');
            err.status = 400;
            err.clientMessage = 'Invalid credentials';
            return next(err);
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error('Wrong Password!');
            err.status = 401;
            err.clientMessage = 'Invalid credentials';
            return next(err);
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" } // token valid for 2 hours
        );

        res.status(200).json({
            message: "Login successful",
            token,
            role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
        });
    } catch (err) {
        const safeError = new Error();
        safeError.status = 500;
        safeError.clientMessage = 'Unable to process request. Please try again later.';
        return next(safeError);
    }
};

exports.registerStudent = async (req, res, next) => {
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
};

exports.verify = async (req, res, next) => {
    try {
        const token = req.query.token;
        if (!token) {
            const err = new Error('No token provided');
            err.status = 400;
            err.clientMessage = 'Verification link is missing';
            return next(err);
        }

        const tempUser = await TempUser.findOne({ token: token });
        if (!tempUser) {
            const error = new Error('Token invalid or expired');
            error.status = 401;
            error.clientMessage = 'Verification link is invalid or has expired';
            return next(error);
        }
        let message;
        if (tempUser.verified) {
            message = "Email already verified. Fill details to complete registration.";
        } else {
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
};