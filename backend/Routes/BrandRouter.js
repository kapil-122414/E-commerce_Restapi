const express = require("express");
const router = express.Router();
const authmiddleware = require("../Middlerware/authmiddleware");
const brands = require("../models/Brand");
const Product = require("../models/productmodels");
const path = require("path");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { resolve } = require("dns");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

router.post(
  "/brand",
  authmiddleware,
  uploads.single("Img"),
  async (req, res) => {
    try {
      const data = req.body;
    

      if (!data.name) {
        return res.status(400).json({ message: "Brand name is required" });
      }
      console.log(req.file);
      if (!req.file) {
        return res.status(400).json({
          message: "Brand image is required",
        });
      }
      const finddata = await brands.findOne({ name: data.name });
      if (finddata) {
        return res.status(400).json({ message: "Brand already exists" });
      }

      const savedata = await brands.create({
        name: data.name,
        status: data.status,
        Img: {
          url: req.file.path,
          public_id: req.file.filename,
        },
      });

      res
        .status(200)
        .json({ message: "Brand created successfully", data: savedata });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get("/brand", authmiddleware, async (req, res) => {
  try {
    let filter = {};
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 4;
    let skip = (page - 1) * limit;
    let search = req.query.search || "";
    const status = req.query.status || "";

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const data = await brands
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const brandWithCount = await Promise.all(
      data.map(async (brand) => {
        const productcount = await Product.countDocuments({
          brand: brand._id,
        });
        return {
          ...brand.toObject(),
          productcount,
        };
      }),
    );

    const totalItems = await brands.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      page,
      totalItems,
      totalPages,
      data: brandWithCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/brand/all", authmiddleware, async (req, res) => {
  const data = await brands.find().select("_id name status");
  res.json(data);
});

router.get("/brand/:id", authmiddleware, async (req, res) => {
  try {
    const data = await brands.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/brand/:id",
  authmiddleware,
  uploads.single("Img"),
  async (req, res) => {
    try {
      const data = await brands.findById(req.params.id);

      if (!data) {
        return res.status(404).json({ message: "Brand not found" });
      }
      const updateData = {};

      if (req.body.name) {
        updateData.name = req.body.name;
      }

      if (req.body.status) {
        updateData.status = req.body.status;
      }

      if (req.file) {
        if (data.Img && data.Img.public_id) {
          await cloudinary.uploader.destroy(data.Img.public_id);
        }

        updateData.Img = {
          url: req.file.path,
          public_id: req.file.filename,
        };
      }

      const updated = await brands.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
        },
      );
      res.status(200).json({ message: "Updated successfully", data: updated });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete("/brand/:id", authmiddleware, async (req, res) => {
  try {
    const data = await brands.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Brand not found" });
    }
    if (data.Img && data.Img.public_id) {
      await cloudinary.uploader.destroy(data.Img.public_id);
    }
    await brands.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
