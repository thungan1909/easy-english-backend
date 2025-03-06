const express = require("express");
const multer = require("multer");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🔹 Get Access Token from Refresh Token
async function getAccessToken() {
    const response = await axios.post(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        new URLSearchParams({
            client_id: process.env.ONEDRIVE_CLIENT_ID,
            client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
            refresh_token: process.env.ONEDRIVE_REFRESH_TOKEN,
            grant_type: "refresh_token",
            redirect_uri: process.env.ONEDRIVE_REDIRECT_URI,
        })
    );

    return response.data.access_token;
}

// 🔹 Upload File to OneDrive
async function uploadFileToOneDrive(fileBuffer, fileName) {
    const accessToken = await getAccessToken();
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${process.env.ONEDRIVE_FOLDER_ID}:/${fileName}:/content`;

    const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
        },
    });

    return response.data["@microsoft.graph.downloadUrl"]; // 🔹 Return file URL
}

// 🔹 API Endpoint: `/api/upload`
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = await uploadFileToOneDrive(req.file.buffer, req.file.originalname);
        res.json({ message: "File uploaded successfully", fileUrl });
    } catch (error) {
        console.error("Upload error:", error.response?.data || error.message);
        res.status(500).json({ message: "Upload failed" });
    }
});

module.exports = router;
