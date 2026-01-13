const authController = require("../controllers/auth.controller");
const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");

// Authentication
router.post("/login", authController.loginUser)
router.post("/register", authController.registerUser)
router.post("/check-email", authController.checkExistEmail);

// Email Verification
router.post("/email/send-code", authController.sendVerificationCode);
router.post("/email/verify", authController.verifyAccount);

// Password Reset
router.post("/password/send-reset-code", authController.sendResetPasswordCode);
router.post("/password/verify-reset-code", authController.verifyResetPasswordCode);
router.post("/password/reset", authController.resetPassword);

router.post("/password/change", authMiddleware, authController.changePassword)

// Get User Profile
router.get("/me", authMiddleware, authController.me)

module.exports = router;

