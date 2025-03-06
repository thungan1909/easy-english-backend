const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const authController = {

    generateHashedCode: async () => {
        const code = crypto.randomInt(100000, 999999).toString();
        const hashedCode = await bcrypt.hash(code, 10);
        return { hashedCode, code, expiresAt: Date.now() + 10 * 60 * 1000 };
    },

    generateAccessToken: (user) => jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "1d" }
    ),

    generateRefreshToken: (user) =>
        jwt.sign(
            { id: user._id, email: user.email }, // Payload
            process.env.JWT_REFRESH_KEY,
            { expiresIn: "365d" }
        ),

    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                return res.status(400).json({ message: "Username or email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const { hashedCode, verificationCode, expiresAt } = await authController.generateHashedCode();
            console.log("Verification Code:", verificationCode); // TODO: Send via email

            const newUser = await User.create({
                username,
                email,
                password: hashedPassword,
                verificationCode: hashedCode,
                verificationExpires: expiresAt,
            });

            res.status(201).json({ message: "Registration successful. Please verify your email.", userId: newUser._id });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    loginUser: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required." });
            }

            const user = await User.findOne({ $or: [{ username }, { email: username }] });
            if (!user || !(await bcrypt.compare(password, user.password)))
                return res.status(401).json({ message: "Invalid username or password." });

            if (!user.isVerified) return res.status(403).json({ message: "Please verify your account first." });

            const accessToken = authController.generateAccessToken(user);
            const refreshToken = authController.generateRefreshToken(user);

            if (!accessToken || !refreshToken) {
                return res.status(500).json({ message: "Token generation failed" });
            }

            res.cookie("refresh", refreshToken, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "strict",
            });


            return res.status(200).json({
                message: "Login successful",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified
                },
                access_token: accessToken,
            });
        } catch (err) {
            console.error("Login Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getVerifyCode: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            if (user.isVerified)
                return res.status(400).json({ message: "User is already verified. Please sign in." });

            const { hashedCode, verificationCode, expiresAt } = await authController.generateHashedCode();
            console.log("Verification Code:", verificationCode); // TODO: Send via email

            user.verificationCode = hashedCode;
            user.verificationExpires = expiresAt;
            await user.save();

            res.status(200).json({ message: "Verification code sent to your email." });
        } catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    verifyAccount: async (req, res) => {
        try {
            const { email, verifyCode } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            if (user.verificationExpires < new Date())
                return res.status(400).json({ message: "Verification code has expired." });

            const isMatch = await bcrypt.compare(verifyCode, user.verificationCode);
            if (!isMatch)
                return res.status(400).json({ message: "Invalid verification code." });

            await User.updateOne(
                { email },
                { $set: { isVerified: true }, $unset: { verificationCode: "", verificationExpires: "" } }
            );

            res.status(200).json({ message: "User verified successfully." });
        } catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getResetCode: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            const { hashedCode: hashedResetCode, verificationCode, expiresAt } = await authController.generateHashedCode();
            console.log(`Reset password code generated for ${email}`, verificationCode); // Logging without exposing the code

            user.resetCode = hashedResetCode;
            user.resetCodeExpires = expiresAt;
            await user.save();

            res.status(200).json({ message: "Reset password code has been sent to your email." });
        } catch (error) {
            console.error("Error generating reset password code:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    verifyCodeResetPassword: async (req, res) => {
        try {
            const { email, resetCode } = req.body;
            const user = await User.findOne({ email });

            if (!user) return res.status(404).json({ message: "User not found." });

            if (!user.resetCode || user.resetCodeExpires < Date.now()) {
                return res.status(400).json({ message: "Invalid or expired reset code." });
            }

            const isCodeValid = await bcrypt.compare(resetCode, user.resetCode);
            if (!isCodeValid) return res.status(400).json({ message: "Invalid reset code." });

            user.isConfirmResetCode = true;
            await user.save();

            res.status(200).json({ message: "Reset code verified successfully." });
        } catch (error) {
            console.error("Verify Reset Code Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            if (!user.isConfirmResetCode)
                return res.status(400).json({ message: "Reset code has not been confirmed." });

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.updateOne(
                { email },
                { $set: { password: hashedPassword, isConfirmResetCode: false, resetCode: null, resetCodeExpires: null } }
            );

            res.status(200).json({ message: "Password reset successfully." });
        } catch (error) {
            console.error("Reset password Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    checkExistEmail: async (req, res) => {
        try {
            const { email } = req.body;
            const exists = !!(await User.findOne({ email }));
            return res.status(200).json({ exists });
        } catch (err) {
            console.error("Check Email Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    me: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: "Invalid or missing authentication token." });
            }

            const user = await User.findById(userId).select("-password -verificationCode -verificationExpires");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json({
                message: "User retrieved successfully",
                user
            });
        } catch (err) {
            console.error("Fetch User Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
};

module.exports = authController;
