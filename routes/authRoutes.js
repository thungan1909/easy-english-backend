const authController = require("../controllers/authController");

const router = require("express").Router();

router.post("/login", authController.loginUser)
router.post("/check-exist-username", authController.checkExistUsername)


module.exports = router;

