require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

const authRoutes = require("./routes/authRoutes")

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS
app.use(cookieParser());


//Routes
app.use("/v1/auth", authRoutes)


// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

