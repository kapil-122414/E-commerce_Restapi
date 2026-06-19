const modelschema = require("../models/schema");
const express = require("express");
const authmiddleware = require("../Middlerware/authmiddleware");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { resolve } = require("dns");
const { stat } = require("fs/promises");

//post api
router.post(
  "/category",
  authmiddleware,
  (req, res, next) => {
    uploads.single("Img")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer/Cloudinary Error:", err.message);
        return res.status(500).json({
          success: false,
          message: "Image upload failed: " + err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image required",
        });
      }

      // ✅ Create and save to MongoDB
      const category = new modelschema({
        Categoryname: req.body.Categoryname,
        Slug: req.body.Slug,
        Status: req.body.Status,
        Img: req.file.path, // Cloudinary URL
      });

      await category.save(); // ✅ This was missing!

      res.status(201).json({
        success: true,
        message: "Category saved successfully",
        data: category,
      });
    } catch (error) {
      console.error("CATEGORY ERROR:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);
//get api
router.get("/category", authmiddleware, async (req, res) => {
  try {
    let filter = {};

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 4;
    let skip = (page - 1) * limit;

    let search = req.query.search || "";
    let status = req.query.status || "";

    if (status) {
      filter.Status = status;
    }

    if (search) {
      filter.Categoryname = {
        $regex: search,
        $options: "i",
      };
    }

    const data = await modelschema
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await modelschema.countDocuments(filter);

    res.status(200).json({
      page,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//delete api
router.delete("/category/:_id", authmiddleware, async (req, res) => {
  try {
    const data = await modelschema.findById(req.params._id);

    if (!data) {
      return res.status(404).json({ message: "not find data" });
    }

    // 🔥 Cloudinary delete
    if (data.Img) {
      const publicId = data.Img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`categories/${publicId}`);
    }

    await modelschema.findByIdAndDelete(req.params._id);

    res.status(200).json({ message: "delete successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//update
router.patch(
  "/category/:_id",
  authmiddleware,
  uploads.single("Img"),
  async (req, res) => {
    try {
      const id = req.params._id;

      const olddata = await modelschema.findById(id);

      if (!olddata) {
        return res.status(404).json({ meaage: "data not found" });
      }

      const updateddata = { ...req.body };

      if (req.file) {
        // old image delete from cloudinary
        if (olddata.Img) {
          const publicId = olddata.Img.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`categories/${publicId}`);
        }

        updateddata.Img = req.file.path; // new URL
      }
      const newdata = await modelschema.findByIdAndUpdate(id, updateddata, {
        new: true,
      });

      res.status(200).json({ message: "successfully", newdata });
    } catch (err) {
      res.status(500).json({ message: "server error" });
    }
  },
);
// get api
router.get("/category/all", authmiddleware, async (req, res) => {
  const data = await modelschema.find().select("_id Categoryname brands");
  res.json(data);
});

router.get("/category/:_id", authmiddleware, async (req, res) => {
  try {
    const data = await modelschema.findById(req.params._id);

    if (!data) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//desciption api
router.post("/ai-description", authmiddleware, async (req, res) => {
  try {
    const { Categoryname, productname } = req.body;
    const Response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Write a short ecommerce category description for "${Categoryname}" in 2 lines.`,
        stream: false,
      }),
    });
    const data = await Response.json();
    res.json({ description: data.response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
