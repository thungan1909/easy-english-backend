const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET?.trim(); // Trim to remove spaces

if (!secret) {
    console.error("❌ JWT_SECRET is missing! Check your .env file.");
    process.exit(1);
}

const payload = {
    id: "67c6c0a66fd3a94727150c7e",
    email: "nganthud@gmail.com",
};

const newToken = jwt.sign(payload, secret, { expiresIn: "1h" });

console.log("✅ New Token:", newToken);
