const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const uploadFileToOneDrive = require("../utils/onedriveUpload");

const router = express.Router();

router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileURL = await uploadFileToOneDrive(req.file);
        res.status(200).json({ fileURL });
    } catch (error) {
        console.error("OneDrive Upload Error:", error.response?.data || error);
        res.status(500).json({ message: "File upload failed" });
    }
});

module.exports = router;
