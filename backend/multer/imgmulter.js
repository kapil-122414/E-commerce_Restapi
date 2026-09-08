const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxFileSize = 2 * 1024 * 1024; // 2MB

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
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed"), false);
  }
};

const uploads = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});

module.exports = uploads;
