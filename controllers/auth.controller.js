const User = require("../models/User");
const authService = require("../services/auth.service");
const passwordService = require("../services/password.service");

const verificationService = require("../services/verification.service");
const handleError = require("../utils/handleError");

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
      return handleError(res, err);
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
      return handleError(res, err);
    }
  },

  sendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;
      await verificationService.sendVerificationCode(email);

      res.status(200).json({ message: "Verification code sent to your email." });

    } catch (err) {
      return handleError(res, err);
    }
  },

  verifyAccount: async (req, res) => {
    try {
      await verificationService.verifyAccount(req.body);
      res.status(200).json({ message: "User verified successfully." });
    } catch (err) {
      return handleError(res, err);
    }
  },

  sendResetPasswordCode: async (req, res) => {
    try {
      await passwordService.sendResetPasswordCode(req.body)
      res
        .status(200)
        .json({ message: "Reset password code has been sent to your email." });
    } catch (err) {
      return handleError(res, err);
    }
  },

  verifyResetPasswordCode: async (req, res) => {
    try {

      await passwordService.verifyResetPasswordCode(req.body)

      res.status(200).json({ message: "Reset code verified successfully." });
    } catch (err) {
      return handleError(res, err);
    }
  },

  resetPassword: async (req, res) => {
    try {
      await passwordService.resetPassword(req.body);

      res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
      return handleError(res, err);
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;
      await passwordService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
      return handleError(res, err);
    }
  },
};

module.exports = authController;
