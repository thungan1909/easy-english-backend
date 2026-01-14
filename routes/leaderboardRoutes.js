const express = require("express");
const leaderboardController = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/top-weekly", leaderboardController.getTopWeeklyRecords);

module.exports = router;
