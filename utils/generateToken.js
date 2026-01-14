const User = require("../models/User");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const VERIFIATION_EXPIRE_TIME = 10 * 60 * 1000; // 10 mins

const generateToken = (user, key, expiresIn) =>
    jwt.sign({ id: user._id, email: user.email }, key, { expiresIn });

const generateHashedCode = async () => {
    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    return { hashedCode, code, expiresAt: Date.now() + VERIFIATION_EXPIRE_TIME };
};

const findUserByEmailOrUsername = (identifier) =>
    User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

module.exports = { generateToken, generateHashedCode, findUserByEmailOrUsername }