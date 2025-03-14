const User = require("../models/User");
require("dotenv").config();

const userController = {

    editUser: async (req, res) => {
        try {
            // const userId = req.user?.id;
            // if (!userId) return res.status(401).json({ message: "Invalid or missing authentication token." });

            // const user = await User.findById(userId).select("-password -verificationCode -verificationExpires");
            // if (!user) return res.status(404).json({ message: "User not found" });
            // console.log(req.body)

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
                avatarUrl, // ✅ Return new avatar URL
            });
        } catch (err) {
            console.error("Fetch User Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

};

module.exports = userController;
