require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoMemoryServer } = require("mongodb-memory-server");


const app = express();
const authRoutes = require("./routes/authRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const userRoutes = require("./routes/userRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const challengeRoutes = require("./routes/challengeRoutes");

const corsOptions = {
    origin: process.env.CLIENT_URL, // Allow frontend origin
    credentials: true, // Allow cookies in CORS requests
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

async function connectDB() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("✅ Connected to in-app MongoDB");
}
connectDB().catch((err) => console.error("❌ MongoDB Error:", err));

// mongoose
//     .connect(process.env.MONGO_URI)
//     .then(() => console.log("✅ Connected to MongoDB"))
//     .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors(corsOptions)); // Secure CORS
app.use(cookieParser()); // Parse cookies


//Routes
app.use("/v1/auth", authRoutes)
app.use("/v1/lesson", lessonRoutes)
app.use("/v1/user", userRoutes)
app.use("/v1/submission", submissionRoutes)
app.use("/v1/leaderboard", leaderboardRoutes);
app.use("/v1/challenge", challengeRoutes);

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

