// models/TempUser.js
const mongoose = require("mongoose");

const TempUserSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, required: true, unique: true },
    passwordHash: String,
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 600 } // auto-delete after 10 min
});

module.exports = mongoose.model("TempUser", TempUserSchema);
