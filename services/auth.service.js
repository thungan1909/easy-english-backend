const User = require("../models/User");
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

module.exports = { register }