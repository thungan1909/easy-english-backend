const User = require("../models/User");
const { generateHashedCode } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const ERRORS = require("../constants/errorCodes");

async function sendResetPasswordCode(email) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error(ERRORS.USER_NOT_FOUND);
    }

    const { hashedCode, code, expiresAt } = await generateHashedCode();

    console.log(`Reset password code generated for ${email}`, code);

    user.resetCode = hashedCode;
    user.resetCodeExpires = expiresAt;
    await user.save();

    return code; // or nothing in prod
}

async function verifyResetPasswordCode({ email, resetCode }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error(ERRORS.USER_NOT_FOUND);

    if (!user.resetCode || user.resetCodeExpires < new Date())
        throw new Error(ERRORS.CODE_EXPIRED);

    const isValid = await bcrypt.compare(resetCode, user.resetCode);
    if (!isValid) throw new Error(ERRORS.INVALID_CODE);

    user.isConfirmResetCode = true;
    await user.save();
}

async function resetPassword({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) throw new Error(ERRORS.USER_NOT_FOUND);

    if (!user.isConfirmResetCode)
        throw new Error(ERRORS.RESET_NOT_CONFIRMED);

    user.password = await bcrypt.hash(password, 10);
    user.isConfirmResetCode = false;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;

    await user.save();
}

async function changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new Error(ERRORS.USER_NOT_FOUND);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error(ERRORS.INCORRECT_PASSWORD);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
}

module.exports = { sendResetPasswordCode, verifyResetPasswordCode, resetPassword, changePassword }