const modelschema = require("../models/schema");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const uploads = require("../multer/imgmulter");
const { resolve } = require("dns");

//post api
router.post("/category", uploads.single("Img"), async (req, res) => {
  try {
    const data = req.body;

    const newcategory = await modelschema.create({
      Img: req.file
        ? req.file.path.replace(/\\/g, "/").replace(/\s/g, "")
        : null,
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
    const data = await modelschema.find();

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//delete api
router.delete("/category/:_id", async (req, res) => {
  try {
    const data = req.params._id;

    const finddata = await modelschema.findByIdAndDelete(data);

    if (!finddata) {
      return res.status(404).json({ message: "not find data" });
    }

    if (finddata.Img) {
      const filepath = path.resolve(finddata.Img); // 🔥 best

      if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
          if (err) {
            console.log("File delete error:", err);
          } else {
            console.log("File deleted successfully");
          }
        });
      } else {
        console.log("File not found:", filepath);
      }
    }

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
    console.log(olddata);
    if (!olddata) {
      return res.status(404).json({ meaage: "data not found" });
    }

    const updateddata = { ...req.body };

    if (req.file) {
      if (olddata.Img) {
        fs.unlink(olddata.Img, (err) => {
          if (err) console.log("Old image delete error:", err);
        });
      }

      updateddata.Img = req.file.path;
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
