const express = require("express");
const router = express.Router();
const brands = require("../models/Brand");

router.post("/brand", async (req, res) => {
  try {
    const data = req.body;
    

    if (!data.name) {
      return res.status(400).json({ message: "Brand name is required" });
    }
    const finddata = await brands.findOne({ Brands: data.Brands });
    if (finddata) {
      return res.status(400).json({ message: "Brand already exists" });
    }
    const savedata = await brands.create(data);
    res
      .status(200)
      .json({ message: "Brand created successfully", data: savedata });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/brand", async (req, res) => {
  try {
    let filter = {};
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
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
    const totalItems = await brands.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      page,
      totalItems,
      totalPages,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/brand/:id", async (req, res) => {
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

router.patch("/brand/:id", async (req, res) => {
  try {
    const data = await brands.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updated = await brands.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({ message: "Updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/brand/:id", async (req, res) => {
  try {
    const data = await brands.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Brand not found" });
    }

    await brands.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
