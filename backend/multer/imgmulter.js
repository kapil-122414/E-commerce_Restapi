const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "categories",
    resource_type: "image",
  },
});

const uploads = multer({ storage ,
  limits:{fileSize: 2*1024*1024}  //2m
 });

module.exports = uploads;
