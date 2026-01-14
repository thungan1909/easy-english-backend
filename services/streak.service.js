// services/streak.service.js
const resetStreakIfNeeded = async (user) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (!user.lastStreakDate || user.streak === 0) return;

    const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    const last = new Date(user.lastStreakDate);

    if (!isSameDay(last, today) && !isSameDay(last, yesterday)) {
        user.streak = 0;
        await user.save();
    }
};

module.exports = { resetStreakIfNeeded };
