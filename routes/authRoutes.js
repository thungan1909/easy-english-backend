const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = require("express").Router();
// 
router.post("/login", authController.loginUser)

//SIGN UP
router.post("/sign-up", authController.registerUser)
router.post("/check-exist-email", authController.checkExistEmail)

// VERIFY ACCOUNT
router.post("/verify-account", authController.verifyAccount)
router.post("/get-verify-code", authController.getVerifyCode)

//RESET PASSWORD
router.post("/get-reset-code", authController.getResetCode)
router.post("/verify-reset-code", authController.verifyCodeResetPassword)
router.post("/reset-password", authController.resetPassword)

router.get("/me", authMiddleware, authController.me)

module.exports = router;

