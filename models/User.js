const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        fullname: { type: String, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        avatarUrl: { type: String, default: "" },
        isVerified: { type: Boolean, default: false },
        verificationCode: { type: String },
        verificationExpires: { type: Date },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
        isConfirmResetCode: { type: Boolean, default: false },
        birthDate: { type: Date },
        gender: { type: String },
        phoneNumber: { type: String },
        city: { type: String },
        district: { type: String },
        ward: { type: String },
        detailAddress: { type: String },
        university: { type: String },
        major: { type: String },
    },
    { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
