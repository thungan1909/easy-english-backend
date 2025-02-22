const User = require("../models/User");
const bcrypt = require("bcrypt");
const req = require("express/lib/request");
const jwt = require("jsonwebtoken");

const authController = {
    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const checkUsername = await User.findOne({ username });
            if (checkUsername) return res.status(400).json("This username is already taken");

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(password, salt);

            // Generate a verification code (6-digit random number)
            const verificationCode = crypto.randomInt(100000, 999999).toString();

            // Create a new user
            const newUser = new User({ username, email, password: hashed, verificationCode });
            const savedUser = await newUser.save();

            await sendVericationEmail(email, verificationCode)
            res.status(201).json({ message: "User registered successfully. Please check your email for verification code.", savedUser });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    sendVericationEmail: async (email, code) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "dtn19092001@gmail.com",
                    pass: "password"
                },
            });

            const mailOptions = {
                from: "email@gmail.com",
                to: email,
                subject: "Email Verification Code",
                text: `Your verification code is: ${code}`,
            };

            await transporter.sendMail(mailOptions);
            console.log("Verification email sent successfully.");
        } catch (error) {
            console.error("Error sending email", error)
        }
    },

    checkExistEmail: async (req, res) => {
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
