const User = require("../models/User");
require("dotenv").config();

const userController = {
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "User ID is required." });
      }

      const user = await User.findById(id).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      res.status(200).json(user);
    } catch (err) {
      console.error("Fetch User Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  getUsersByIds: async (req, res) => {
    try {
      const { ids } = req.query;

      if (!ids) {
        return res.status(400).json({ message: "User IDs are required." });
      }

      const userIds = ids.split(",");
      const users = await User.find({ _id: { $in: userIds } }).select(
        "-password"
      );

      res.status(200).json(users);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateUserInfo: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access" });
      }

      const { username, email, ...updateFields } = req.body;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "User information updated successfully",
        user: {
          username: updatedUser.username,
          email: updatedUser.email,
          ...updateFields,
        },
      });
    } catch (err) {
      console.error("Fetch User Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateAvatar: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No user specified." });
      }

      const { avatarUrl } = req.body;
      if (!avatarUrl) {
        return res.status(400).json({ message: "Avatar is required." });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatarUrl },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "Avatar updated successfully.",
        avatarUrl,
      });
    } catch (err) {
      console.error("Fetch User Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  updateStreak: async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: No user specified." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const today = new Date().toDateString();
        const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate).toDateString() : null;

        if (lastStreakDate === today) {
            return res.status(200).json({
                message: "Streak already counted today",
                currentStreak: user.streak,
            });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const wasYesterday = lastStreakDate === yesterday.toDateString();

        if (wasYesterday) {
            user.streak += 1;
        } else {
            user.streak = 1; // reset streak if not consecutive
        }

        user.lastStreakDate = new Date();

        await user.save();

        return res.status(200).json({
            message: "Streak updated successfully",
            currentStreak: user.streak,
        });
    
    } catch (err) {
      console.error("Update Streak Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = userController;
