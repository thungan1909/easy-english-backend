const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "easy-english", // Change this to your desired folder name
        resource_type: "auto", // Auto-detect image/audio
    },
});

const upload = multer({ storage });

module.exports = upload;
