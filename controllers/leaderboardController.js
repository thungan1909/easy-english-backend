const User = require("../models/User");
const moment = require("moment");

const leaderboardController = {
    getTopWeeklyRecords: async (req, res) => {
        try {
            const startOfWeek = moment().startOf("isoWeek").toDate();
            const endOfWeek = moment().endOf("isoWeek").toDate();

            const pipeline = [
                { $unwind: "$weeklyScores" },
                {
                    $match: {
                        "weeklyScores.weekStart": {
                            $gte: new Date(startOfWeek),
                            $lte: new Date(endOfWeek)
                        }
                    }
                }, {
                    $group: {
                        _id: "$_id",
                        username: { $first: "$username" },
                        avatarUrl: { $first: "$avatarUrl" },
                        totalWeeklyScore: { $sum: "$weeklyScores.score" }
                    }
                },
                { $sort: { totalWeeklyScore: -1 } },
                { $limit: 10 }
            ];

            const topRecords = await User.aggregate(pipeline);

            res.status(200).json(topRecords);
        } catch (error) {
            res.status(500).json({ success: false, message: "Server Error", error: error.message });
        }
    }
}

module.exports = leaderboardController;