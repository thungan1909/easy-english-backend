const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/login", authController.loginUser)
router.post("/check-exist-email", authController.checkExistEmail)
router.post("/sign-up", authController.registerUser)
router.post("/verify-user", authController.verificationUser)
router.post("/get-verify-code", authController.getVerifyCode)
router.get("/me", authMiddleware, authController.me)

module.exports = router;

