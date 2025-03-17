const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

const storage = multer.memoryStorage();
const upload = multer({ storage });
// User
router.post("/update", authMiddleware, userController.updateUserInfo);

router.post("/update-avatar", authMiddleware,
    upload.single("avatarUrl"),
    userController.updateAvatar
);


module.exports = router;