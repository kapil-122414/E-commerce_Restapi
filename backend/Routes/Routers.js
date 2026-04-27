const modelschema = require("../models/schema");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { resolve } = require("dns");
const { stat } = require("fs/promises");

//post api
router.post("/category", uploads.single("Img"), async (req, res) => {
  try {
    const data = req.body;

    const newcategory = await modelschema.create({
      Img: req.file ? req.file.path : null,
      ...data,

      //    Img: req.file ? req.file.path.replace(/\\/g, "/") : null,
      //   Categoryname: data.Categoryname,
      //   Slug: data.Slug,
      //   Description: data.Description,
    });

    res.status(200).json({ Message: "successfully", data: newcategory });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});
//get api
router.get("/category", async (req, res) => {
  try {
    let filter = {};
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 4;
    let skip = (page - 1) * limit;
    let search = req.query.search || "";
    const status = req.query.status || "";

    if (status) {
      filter.Status = status;
    }
    if (search) {
      filter.Categoryname = { $regex: search, $options: "i" };
    }

    const data = await modelschema
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await modelschema.countDocuments();

    res
      .status(200)
      .json({ page, total, totalPages: Math.ceil(total / limit), data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//delete api
router.delete("/category/:_id", async (req, res) => {
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
router.patch("/category/:_id", uploads.single("Img"), async (req, res) => {
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
    res.status.json({ message: "server error" });
  }
});
// get api
router.get("/category/:_id", async (req, res) => {
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
module.exports = router;
