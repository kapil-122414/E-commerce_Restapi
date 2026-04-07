const express = require("express");
const router = express.Router();
const productschema = require("../models/productmodels");
const fs = require("fs");
const path = require("path");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { resolve } = require("dns");

//post api
router.post("/product", uploads.single("Img"), async (req, res) => {
  try {
    const data = req.body;

    const newproduct = await productschema.create({
      Img: req.file ? req.file.path : null,
      ...data,
    });
    console.log(newproduct);

    res.status(200).json({ message: "successfully", newproduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/product", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 12;
    let skip = (page - 1) * limit;
    const data = await productschema.find().skip(skip).limit(limit);
    const total = await productschema.countDocuments();
    res
      .status(200)
      .json({
        message: "successfully",
        page,
        total,
        totalPages: Math.ceil(total / limit),
        data,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
