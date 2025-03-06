const authController = require("../controllers/authController");
const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");

// Authentication
router.post("/login", authController.loginUser)
router.post("/sign-up", authController.registerUser)
router.post("/check-exist-email", authController.checkExistEmail)

// Account Verification
router.post("/verify-account", authController.verifyAccount)
router.post("/get-verify-code", authController.getVerifyCode)

// Password Reset
router.post("/get-reset-code", authController.getResetCode)
router.post("/verify-reset-code", authController.verifyCodeResetPassword)
router.post("/reset-password", authController.resetPassword)

// Get User Profile
router.get("/me", authMiddleware, authController.me)

module.exports = router;

