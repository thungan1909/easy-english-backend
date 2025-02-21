const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authController = {
    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const checkUsername = await User.findOne({ username });
            if (checkUsername) return res.status(400).json("This username is already taken");

            const checkEmail = await User.findOne({ email });
            if (checkEmail) return res.status(400).json("This email is already taken");

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);

            const newUser = new User({ username, email, password: hashed });
            const savedUser = await newUser.save();

            res.status(201).json(savedUser);
        } catch (err) {
            console.error("Login Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    checkExistEmail: async (req, res) => {
        console.log("checkExistEmail")
        try {
            const { email } = req.body;
            const checkEmail = await User.findOne({ email });

            return res.status(200).json({ exists: !!checkEmail });
        } catch (err) {
            console.error("Error checking username:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    generateAccessToken: (user) => {
        return jwt.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_ACCESS_KEY,
            { expiresIn: "1d" }
        );
    },

    generateRefreshToken: (user) => {
        return jwt.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_REFRESH_KEY,
            { expiresIn: "365d" }
        );
    },

    loginUser: async (req, res) => {
        try {
            const { username, password } = req.body;

            const user = await User.findOne({ username }).select("+password");
            if (!user) return res.status(400).json("Incorrect username or password");

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) return res.status(400).json("Incorrect username or password");

            const accessToken = authController.generateAccessToken(user);
            const refreshToken = authController.generateRefreshToken(user);

            if (!accessToken || !refreshToken) {
                return res.status(500).json({ message: "Token generation failed" });
            }

            res.cookie("refresh", refreshToken, {
                httpOnly: true,
                secure: false,
                path: "/",
                sameSite: "strict",
            });

            const { password: _, ...userData } = user._doc;
            res.status(200).json({ message: "Login successful", user: userData, accessToken, refreshToken });
        } catch (err) {
            console.error("Login Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
};

module.exports = authController;
