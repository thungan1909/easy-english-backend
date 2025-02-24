const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    verificationExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
