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
router.post(
  "/product",
  uploads.fields([
    { name: "Img", maxCount: 1 },
    { name: "variantImages", maxCount: 20 },
  ]),
  async (req, res) => {
    try {
      const {
        Productname,
        description,
        shortDescription,
        slug,
        categoryId,
        brand,
        status,
        price,
        mrp,
        discount,
      } = req.body;
      let variants = JSON.parse(req.body.variant || "[]");

      const productImage = req.files["Img"] ? req.files["Img"][0].path : null;
      const variantImg = req.files["variantImages"] || [];
      variants = variants.map((v, i) => ({
        imges: {
          url: variantImg[i] ? variantImg[i].path : "",
        },
        size: v.size,
        colour: v.color,
        price1: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku,
        mrp1: Number(v.mrp),
        discount1: Number(v.discount),
      }));

      const newproduct = await productschema.create({
        Productname,
        Description: description, 
        slug,
        shortdiscription: shortDescription, 
        brand,
        categoryId: categoryId,
        status,
        price: Number(price),
        mrp: Number(mrp),
        discount: Number(discount),

        Img: {
          url: productImage,
        },

        variant: variants,
      });
      console.log(newproduct);

      res.status(200).json({ message: "successfully", newproduct });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);
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
      .limit(limit);
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
    if (data.Img) {
      let publicId = data.Img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);
    }
    await productschema.findByIdAndDelete(req.params._id);

    res.status(200).json({ message: "successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const updatedata = { ...req.body };

    if (req.file) {
      if (olddata.Img) {
        const publicId = olddata.Img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
      }
      updatedata.Img = req.file.path;
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
router.get("/product/:_id", async (req, res) => {
  try {
    const data = await productschema.findById(req.params._id);

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
