const { generateHashedCode } = require("../utils/generateToken");
const { sendVerificationEmail } = require("../utils/mailer");
require("dotenv").config();

const createAndSendVerification = async (user) => {

    const { hashedCode, code, expiresAt } = await generateHashedCode();
    // DEBUG: Log verification code for local development only
    console.log("Verification Code (server log):", code, expiresAt);

    user.verificationCode = hashedCode;
    user.verificationExpires = expiresAt;
    await user.save();

    try {
        await sendVerificationEmail(user.email, code, expiresAt);
    } catch (err) {

        //rollback
        user.verificationCode = undefined;
        user.verificationExpires = undefined;
        await user.save();
        throw new Error("EMAIL_SEND_FAILED");
    }
}

module.exports = { createAndSendVerification }