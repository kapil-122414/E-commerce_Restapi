const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = "categories";

    if (req.originalUrl.includes("product")) folderName = "products";
    else if (req.originalUrl.includes("brand")) folderName = "brands";

    return {
      folder: folderName,
      resource_type: "image",
      timeout: 120000,
    };
  },
});

const uploads = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = uploads;
