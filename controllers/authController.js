const User = require("../models/User");
const bcrypt = require("bcrypt");
const req = require("express/lib/request");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { google } = require("googleapis");
const { authorize } = require("../gmail");


let oAuth2Client; // Declare oAuth2Client here

authorize(client => {
    oAuth2Client = client; // Assign the authorized client to the variable
});


const authController = {
    sendVerificationEmail: async (email, code) => {
        try {
            const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
            const message = [
                "From: me",
                `To: ${email}`,
                "Subject: Email Verification Code",
                "",
                `Your verification code is: ${code}`,
            ].join("\n");

            const encodedMessage = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
            await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: encodedMessage,
                },
            });

            console.log("Verification email sent successfully.");
        } catch (error) {
            console.error("Error sending email", error)
        }
    },

    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const checkUsername = await User.findOne({ username });
            if (checkUsername) return res.status(400).json("This username is already taken");

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Generate a verification code (6-digit random number)
            const verificationCode = crypto.randomInt(100000, 999999).toString();
            console.log(verificationCode, "verificationCode")
            const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // Create a new user
            const newUser = new User({ username, email, password: hashedPassword, verificationCode: hashedVerificationCode, verificationExpires: expiresAt });
            console.log("new USER", newUser)
            await newUser.save();

            // await authController.sendVerificationEmail(email, verificationCode)
            res.status(201).json({
                message: "User registered successfully. Please check your email for verification code.",
                userId: newUser._id
            });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    checkExistEmail: async (req, res) => {
        try {
            console.log("checkExistEmail")
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
