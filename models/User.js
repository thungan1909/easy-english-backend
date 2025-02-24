const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    verificationCode: String,
    verificationExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
