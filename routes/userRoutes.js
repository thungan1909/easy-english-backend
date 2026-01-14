const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.patch("/update", authMiddleware, userController.updateUserInfo);
router.post("/update-avatar", authMiddleware,
    upload.single("avatarUrl"),
    userController.updateAvatar
);

router.patch("/update-streak", authMiddleware,
    userController.updateStreak
);

router.get("/ids", userController.getUsersByIds);
router.get("/:id", userController.getUserById);

module.exports = router;