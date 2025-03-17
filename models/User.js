const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        fullName: { type: String, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        phoneNumber: { type: String },
        avatarUrl: { type: String, default: "" },
        birthDate: { type: Date },
        gender: { type: String },
        city: { type: String },
        district: { type: String },
        ward: { type: String },
        detailAddress: { type: String },
        university: { type: String },
        major: { type: String },
        // AUTHEN
        isVerified: { type: Boolean, default: false },
        verificationCode: { type: String },
        verificationExpires: { type: Date },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
        isConfirmResetCode: { type: Boolean, default: false },
    },
    { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
