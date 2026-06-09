const express = require("express");
const router = express.Router();
const productschema = require("../models/productmodels");
const fs = require("fs");
const path = require("path");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { resolve } = require("dns");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

//post api
router.post("/product", uploads.single("Img"), async (req, res) => {
  try {
    const {
      Productname,
      Description,
      shortdiscription,
      slug,
      categoryId,
      brand,
      status,
      price,
      mrp,
      stock,
      discount,
    } = req.body;

    const variants = JSON.parse(req.body.variant || "[]");

    const newProduct = await productschema.create({
      Productname,
      Description,
      shortdiscription,
      slug,
      categoryId,
      brand,
      status,
      stock: Number(stock),
      price: Number(price),
      mrp: Number(mrp),
      discount: Number(discount),

      Img: req.file
        ? {
            url: req.file.path,
            public_id: req.file.filename,
          }
        : null,

      variant: variants.map((v) => ({
        size: v.size,
        color: v.color,
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        sku: v.sku,
      })),
    });

    res.status(201).json({
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
});
//get api
router.get("/product", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 4;
    let skip = (page - 1) * limit;
    let status = req.query.status || "";
    let search = req.query.search || "";

    const { Productname, categoryId } = req.query;
    let filter = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.Productname = { $regex: search, $options: "i" };
    }
    if (Productname) {
      filter.Productname = { $regex: Productname, $options: "i" };
    }
    if (req.query.minPrice && req.query.maxPrice) {
      filter.price = {
        $gte: req.query.minPrice,
        $lte: req.query.maxPrice,
      };
    }
    const data = await productschema
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId")
      .populate("brand");
    const total = await productschema.countDocuments(filter);
    res.status(200).json({
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
//delete
router.delete("/product/:_id", async (req, res) => {
  try {
    const data = await productschema.findById(req.params._id);

    if (!data) {
      return res.status(404).json({ message: "not found data" });
    }
    if (data.Img?.public_id) {
      console.log("after", data.Img);
      const imgdelete = await cloudinary.uploader.destroy(data.Img.public_id);
    }
    await productschema.findByIdAndDelete(req.params._id);

    res.status(200).json({ message: "successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});
//patch
router.patch("/product/:_id", uploads.single("Img"), async (req, res) => {
  try {
    const id = req.params._id;
    const olddata = await productschema.findById(id);

    if (!olddata) {
      return res.status(404).json({ message: "not found" });
    }

    console.log(olddata.Img?.public_id);
    const updatedata = { ...req.body };
    if (updatedata.variant) {
      updatedata.variant = JSON.parse(updatedata.variant);
    }
    if (req.file) {
      if (olddata.Img?.public_id) {
        await cloudinary.uploader.destroy(olddata.Img.public_id);
      }
      updatedata.Img = { url: req.file.path, public_id: req.file.filename };
    }
    const newdata = await productschema.findByIdAndUpdate(id, updatedata, {
      new: true,
    });
    console.log(newdata);
    res.status(200).json({ message: "successfully", newdata });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//get api
// get api
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productschema
      .findById(id)
      .populate("brand")
      .populate("categoryId");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
