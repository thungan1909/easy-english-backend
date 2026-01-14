const User = require("../models/User");
const { findUserByEmailOrUsername, generateToken } = require("../utils/generateToken");
const { createAndSendVerification } = require("../utils/verification");
const bcrypt = require("bcryptjs");

async function register({ username, email, password }) {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
        throw new Error("USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
    })

    await createAndSendVerification(user);

    return user;
}

async function login({ username, password }) {
    if (!username || !password) {
        throw new Error("MISSING_CREDENTIALS")
    }

    const user = await findUserByEmailOrUsername(username);
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("INVALID_CREDENTIALS");
    }

    if (!user.isVerified) {
        throw new Error("NOT_VERIFIED");
    }

    const accessToken = generateToken(user, process.env.JWT_ACCESS_KEY, "1d");
    const refreshToken = generateToken(user, process.env.JWT_REFRESH_KEY, "365d");

    return { user, accessToken, refreshToken };

}

module.exports = { register, login }