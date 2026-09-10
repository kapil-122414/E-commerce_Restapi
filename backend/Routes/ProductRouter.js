const express = require("express");
const router = express.Router();
const productschema = require("../models/productmodels");
const authmiddleware = require("../Middlerware/authmiddleware");
const uploads = require("../multer/imgmulter");
const cloudinary = require("../config/cloudinary");
const { productValidation, mongoIdParam, paginationValidation } = require("../middleware/validation");

//post api
router.post(
  "/product",
  authmiddleware,
  uploads.single("Img"),
  productValidation,
  async (req, res) => {
    try {
      const {
        Productname,
        Description,
        shortDescription,
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
      const totalStock = variants.reduce((sum, item) => {
        return sum + Number(item.stock || 0);
      }, 0);

      const newProduct = await productschema.create({
        Productname,
        Description,
        shortDescription,
        slug,
        categoryId,
        brand,
        status,
        stock: Number(totalStock),
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
      res.status(500).json({
        message: "Failed to create product",
      });
    }
  },
);

//get product count by category
router.get("/product/count-by-category", authmiddleware, async (req, res) => {
  try {
    const counts = await productschema.aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]);
    res.status(200).json({ success: true, data: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch counts" });
  }
});

//get api
router.get("/product", authmiddleware, paginationValidation, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
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
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

//delete
router.delete("/product/:_id", authmiddleware, mongoIdParam, async (req, res) => {
  try {
    const data = await productschema.findById(req.params._id);

    if (!data) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (data.Img?.public_id) {
      await cloudinary.uploader.destroy(data.Img.public_id);
    }
    await productschema.findByIdAndDelete(req.params._id);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

//patch
router.patch(
  "/product/:_id",
  authmiddleware,
  mongoIdParam,
  uploads.single("Img"),
  async (req, res) => {
    try {
      const id = req.params._id;
      const olddata = await productschema.findById(id);

      if (!olddata) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedata = { ...req.body };
      if (updatedata.variant) {
        updatedata.variant = JSON.parse(updatedata.variant);
      }
      if (updatedata.variant) {
        updatedata.stock = updatedata.variant.reduce((sum, item) => {
          return sum + Number(item.stock || 0);
        }, 0);
      }
      if (updatedata.shortdiscription !== undefined) {
        updatedata.shortDescription = updatedata.shortdiscription;
        delete updatedata.shortdiscription;
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
      res.status(200).json({ message: "Product updated successfully", newdata });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  },
);

//get api
router.get("/product/:id", authmiddleware, mongoIdParam, async (req, res) => {
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
      message: "Failed to fetch product",
    });
  }
});

// admin get all products
router.get("/admin/product", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let status = req.query.status || "";
    let search = req.query.search || "";

    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.Productname = { $regex: search, $options: "i" };
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
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

module.exports = router;
