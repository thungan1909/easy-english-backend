const User = require("../models/User");
require("dotenv").config();

const userController = {

    updateUserInfo: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized access" });
            }

            const { username, email, ...updateFields } = req.body;

            // Find user but don't update username or email
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateFields }, // Update only the allowed fields
                { new: true, runValidators: true }
            ).select("-password"); // Exclude password from the response

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({
                message: "User information updated successfully",
                user: {
                    username: updatedUser.username, // Ensure username is still returned
                    email: updatedUser.email, // Ensure email is still returned
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
                return res.status(401).json({ message: "Unauthorized: No user specified." });
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

};

module.exports = userController;
