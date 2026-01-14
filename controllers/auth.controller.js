const User = require("../models/User");
const bcrypt = require("bcryptjs");
const authService = require("../services/auth.service");
const passwordService = require("../services/password.service");

const verificationService = require("../services/verification.service");

require("dotenv").config();

const authController = {
  resetStreak: async (user) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastStreakDate = user.lastStreakDate
      ? new Date(user.lastStreakDate)
      : null;

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (
      lastStreakDate &&
      !isSameDay(lastStreakDate, today) &&
      !isSameDay(lastStreakDate, yesterday) &&
      user.streak !== 0
    ) {
      user.streak = 0;
      await user.save();
    }
  },

  me: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res
          .status(401)
          .json({ message: "Invalid or missing authentication token." });

      const user = await User.findById(userId).select(
        "-password -verificationCode -verificationExpires"
      );
      if (!user) return res.status(404).json({ message: "User not found" });

      await authController.resetStreak(user);
      return res
        .status(200)
        .json({ message: "User retrieved successfully", user });
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
      const user = await authService.register(req.body);
      res.status(201).json({
        message: "Registration successful. Please verify your email.",
        userId: user._id,
      })
    } catch (err) {
      if (err.message === "USER_EXISTS") {
        return res
          .status(400)
          .json({ message: "Username or email already exists." });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }

  },

  loginUser: async (req, res) => {
    try {

      const { user, accessToken, refreshToken } = await authService.login(req.body);

      res.cookie("refresh", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
      });

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        },
        access_token: accessToken,
      });
    }
    catch (err) {
      if (err.message === "MISSING_CREDENTIALS") {
        return res.status(400).json({
          message: "Username and password are required.",
        });
      }

      if (err.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          message: "Invalid username or password.",
        });
      }

      if (err.message === "NOT_VERIFIED") {
        return res.status(403).json({
          message: "Please verify your account first.",
        });
      }

      console.error("Login Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  sendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;
      await verificationService.sendVerificationCode(email);

      res.status(200).json({ message: "Verification code sent to your email." });

    } catch (err) {

      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (err.message === "ALREADY_VERIFIED") {
        return res.status(400).json({
          message: "User is already verified. Please sign in.",
        });
      }

      if (err.message === "COOLDOWN_ACTIVE") {
        return res.status(429).json({
          message: "Please wait before requesting another code.",
        });
      }

      console.error("Verification Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  verifyAccount: async (req, res) => {
    try {
      await verificationService.verifyAccount(req.body);
      res.status(200).json({ message: "User verified successfully." });
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({ message: "User not found." });
      }

      if (err.message === "ALREADY_VERIFIED") {
        return res.status(400).json({ message: "User already verified." });
      }

      if (err.message === "CODE_EXPIRED") {
        return res.status(400).json({
          message: "Verification code has expired.",
        });
      }

      if (
        err.message === "INVALID_CODE" ||
        err.message === "NO_VERIFICATION_CODE"
      ) {
        return res.status(400).json({
          message: "Invalid verification code.",
        });
      }

      console.error("Verify Account Error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

  },

  sendResetPasswordCode: async (req, res) => {
    try {
      await passwordService.sendResetPasswordCode(req.body)
      res
        .status(200)
        .json({ message: "Reset password code has been sent to your email." });
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      console.error("Error generating reset password code:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  verifyResetPasswordCode: async (req, res) => {
    try {

      await passwordService.verifyResetPasswordCode(req.body)

      res.status(200).json({ message: "Reset code verified successfully." });
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (err.message === "CODE_EXPIRED") {
        return res.status(404).json({
          message: "Invalid or expired reset code.",
        });
      }

      if (err.message === "INVALID_CODE") {
        return res.status(404).json({
          message: "Invalid reset code.",
        });
      }

      console.error("Verify Reset Code Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      await passwordService.resetPassword(req.body);

      res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (err.message === "RESET_NOT_CONFIRMED") {
        return res.status(400).json({
          message: "Reset code not confirmed."
        });
      }

      console.error("Reset password Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;
      await passwordService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      if (err.message === "INVALID_PASSWORD") {
        return res.status(400).json({
          message: "Current Password is Incorrect."
        });
      }
      console.error("Change Password Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = authController;
