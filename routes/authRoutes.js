const authController = require("../controllers/authController");

const router = require("express").Router();

router.post("/login", authController.loginUser)
router.post("/check-exist-email", authController.checkExistEmail)
router.post("/sign-up",authController.registerUser)

module.exports = router;

