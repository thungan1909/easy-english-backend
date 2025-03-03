const User = require("../models/User");
const bcrypt = require("bcrypt");
const req = require("express/lib/request");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { google } = require("googleapis");
const { authorize } = require("../gmail");


let oAuth2Client;

// authorize(client => {
//     oAuth2Client = client;
// });


const authController = {
    // sendVerificationEmail: async (email, code) => {
    //     try {
    //         const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    //         const message = [
    //             "From: me",
    //             `To: ${email}`,
    //             "Subject: Email Verification Code",
    //             "",
    //             `Your verification code is: ${code}`,
    //         ].join("\n");

    //         const encodedMessage = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
    //         await gmail.users.messages.send({
    //             userId: "me",
    //             requestBody: {
    //                 raw: encodedMessage,
    //             },
    //         });
    //     } catch (error) {
    //         console.error("Error sending email", error)
    //     }
    // },

    createVerifyCode: async () => {
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);

        return {
            hashedVerificationCode,
            verificationCode,
            expiresAt: new Date(Date.now() + 10 * 60000), // Expires in 10 minutes
        };
    },

    registerUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            if (await User.findOne({ username }))
                return res.status(400).json({ message: "Username is already taken." });


            if (await User.findOne({ email }))
                return res.status(400).json({ message: "Email is already taken." });

            const hashedPassword = await bcrypt.hash(password, 10);

            const { hashedVerificationCode, verificationCode, expiresAt } = await authController.createVerifyCode();
            console.log("Verification Code:", verificationCode); // TODO: Send via email

            const newUser = await User.create({
                username,
                email,
                password: hashedPassword,
                verificationCode: hashedVerificationCode,
                verificationExpires: expiresAt,
            });

            res.status(201).json({
                message: "User registered successfully. Please check your email for the verification code.",
                userId: newUser._id
            });
        } catch (err) {
            console.error("Registration Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    getVerifyCode: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            if (user.isVerified)
                return res.status(400).json({ message: "User is already verified. Please sign in." });

            const { hashedVerificationCode, verificationCode, expiresAt } = await authController.createVerifyCode();
            console.log("Verification Code:", verificationCode); // TODO: Send via email

            user.verificationCode = hashedVerificationCode;
            user.verificationExpires = expiresAt;
            await user.save();

            res.status(200).json({ message: "Verification code sent to your email." });
        } catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    verificationUser: async (req, res) => {
        try {
            const { email, verifyCode } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found." });

            if (user.verificationExpires < new Date())
                return res.status(400).json({ message: "Verification code has expired." });

            const isMatch = await bcrypt.compare(verifyCode, user.verificationCode);
            if (!isMatch)
                return res.status(400).json({ message: "Invalid verification code." });

            await User.updateOne(
                { email },
                { $set: { isVerified: true }, $unset: { verificationCode: "", verificationExpires: "" } }
            );

            res.status(200).json({ message: "User verified successfully." });
        } catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    checkExistEmail: async (req, res) => {
        try {
            const { email } = req.body;
            const exists = !!(await User.findOne({ email }));
            return res.status(200).json({ exists });
        } catch (err) {
            console.error("Check Email Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    generateAccessToken: (user) => jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        process.env.JWT_ACCESS_KEY,
        { expiresIn: "1d" }
    ),

    generateRefreshToken: (user) =>
        jwt.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_REFRESH_KEY,
            { expiresIn: "365d" }
        ),


    loginUser: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: "Username and password are required." });
            }

            const user = await User.findOne({ username }) || await User.findOne({ email: username });
            if (!user || !(await bcrypt.compare(password, user.password)))
                return res.status(401).json({ message: "Invalid username or password." });

            if (!user.isVerified) return res.status(403).json({ message: "Please verify your account first." });

            const accessToken = authController.generateAccessToken(user);
            const refreshToken = authController.generateRefreshToken(user);

            if (!accessToken || !refreshToken) {
                return res.status(500).json({ message: "Token generation failed" });
            }

            res.cookie("refresh", refreshToken, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "strict",
            });


            const { password: _, verificationCode, verificationExpires, ...userData } = user._doc;

            return res.status(200).json({
                message: "Login successful",
                user: userData,
                access_token: accessToken,
                refresh_token: refreshToken
            });
        } catch (err) {
            console.error("Login Error:", err);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
};

module.exports = authController;
