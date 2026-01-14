const User = require("../models/User");
const { createAndSendVerification } = require("../utils/verification");
const bcrypt = require("bcryptjs");

const RESEND_COOLDOWN = 60 * 1000; // 1 minute

async function sendVerificationCode(email) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (user.isVerified) {
        throw new Error("ALREADY_VERIFIED");
    }

    if (user.lastVerificationSent && Date.now() - user.lastVerificationSent.getTime() < RESEND_COOLDOWN) {
        throw new Error("COOLDOWN_ACTIVE")
    }

    await createAndSendVerification(user);

    return true;
}

async function verifyAccount({ email, verifyCode }) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (user.isVerified) {
        throw new Error("ALREADY_VERIFIED");
    }

    if (!user.verificationCode || !user.verificationExpires) {
        throw new Error("NO_VERIFICATION_CODE");
    }

    if (Date.now() > user.verificationExpires) {
        throw new Error("CODE_EXPIRED");
    }

    const isValid = await bcrypt.compare(verifyCode, user.verificationCode);

    if (!isValid) {
        throw new Error("INVALID_CODE");
    }

    await User.updateOne(
        { _id: user._id },
        {
            $set: { isVerified: true },
            $unset: {
                verificationCode: "",
                verificationExpires: "",
                verificationSentAt: "",
            },
        });

    return true;
}

module.exports = { sendVerificationCode, verifyAccount }
