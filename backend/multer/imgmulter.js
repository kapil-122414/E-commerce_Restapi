const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, res) => {
    let folderName = "categories";
    if (req.originalUrl.includes("product")) {
      folderName = "products";
    }
    return {
      folder: folderName,
      resource_type: "image",
    };
  },
});

const uploads = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, //2m
});

module.exports = uploads;
