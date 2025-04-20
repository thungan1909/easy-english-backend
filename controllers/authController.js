const User = require("../models/User");
const bcrypt = require("bcrypt");
const { findUserByEmailOrUsername, generateToken, generateHashedCode } = require("../utils/generateToken");
require("dotenv").config();

const authController = {
  resetStreak: async(user) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastSubmitDate = user.lastSubmitDate ? new Date(user.lastSubmitDate) : null;

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (
      lastSubmitDate &&
      !isSameDay(lastSubmitDate, today) &&
      !isSameDay(lastSubmitDate, yesterday) &&
      user.streak !== 0
    ) {
      user.streak = 0;
      await user.save();
    }
  },
    me: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: "Invalid or missing authentication token." });

            const user = await User.findById(userId).select("-password -verificationCode -verificationExpires");
            if (!user) return res.status(404).json({ message: "User not found" });

            await authController.resetStreak(user); 
            return res.status(200).json({ message: "User retrieved successfully", user });
        } catch (err) {
            console.error("Fetch User Error:", err);
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

    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            if ((await findUserByEmailOrUsername(username)) || (await findUserByEmailOrUsername(email))) {
                return res.status(400).json({ message: "Username or email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const { hashedCode, code, expiresAt } = await generateHashedCode();
            console.log("Verification Code:", code); // TODO: Send via email

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
            if (!username || !password) return res.status(400).json({ message: "Username and password are required." });

            const user = await findUserByEmailOrUsername(username);
            if (!user || !(await bcrypt.compare(password, user.password)))
                return res.status(401).json({ message: "Invalid username or password." });

            if (!user.isVerified) return res.status(403).json({ message: "Please verify your account first." });

            const accessToken = generateToken(user, process.env.JWT_ACCESS_KEY, "1d");
            const refreshToken = generateToken(user, process.env.JWT_REFRESH_KEY, "365d");

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

    sendVerificationCode: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });
            if (user.isVerified) return res.status(400).json({ message: "User is already verified. Please sign in." });

            const { hashedCode, code, expiresAt } = await generateHashedCode();
            console.log("Verification Code:", code); // TODO: Send via email

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

            if (Date.now() > user.verificationExpires)
                return res.status(400).json({ message: "Verification code has expired." });

            if (!(await bcrypt.compare(verifyCode, user.verificationCode)))
                return res.status(400).json({ message: "Invalid verification code." });

            await User.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationCode: "", verificationExpires: "" } });

            res.status(200).json({ message: "User verified successfully." });
        } catch (error) {
            console.error("Verification Error:", error);
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

            await User.updateOne({ email }, {
                $set: { password: hashedPassword, isConfirmResetCode: false },
                $unset: { resetCode: "", resetCodeExpires: "" },
            });

            res.status(200).json({ message: "Password reset successfully." });
        } catch (error) {
            console.error("Reset password Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    sendResetPasswordCode: async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            const { hashedCode: hashedResetCode, code, expiresAt } = await generateHashedCode();
            console.log(`Reset password code generated for ${email}`, code);

            user.resetCode = hashedResetCode;
            user.resetCodeExpires = expiresAt;
            await user.save();

            res.status(200).json({ message: "Reset password code has been sent to your email." });
        } catch (error) {
            console.error("Error generating reset password code:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    verifyResetPasswordCode: async (req, res) => {
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

    changePassword: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { currentPassword, newPassword } = req.body;

            if (!userId || !currentPassword || !newPassword) {
                return res.status(400).json({ message: "Missing required fields." });
            }

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found." });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            res.status(200).json({ message: "Password changed successfully." });
        } catch (error) {
            console.error("Change Password Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
};

module.exports = authController;
