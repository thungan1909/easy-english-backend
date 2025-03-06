const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        name: { type: String, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true }, // Hashed before saving
        isVerified: { type: Boolean, default: false },
        verificationCode: { type: String },
        verificationExpires: { type: Date },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
        isConfirmResetCode: { type: Boolean, default: false }
    },
    { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
