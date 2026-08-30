const express = require("express");
const router = express.Router();
const authmiddleware = require("../Middlerware/authmiddleware");
const Product = require("../models/productmodels");
const Order = require("../models/orderdmodels");
const User = require("../models/Registermodels");
const Category = require("../models/schema");
const Brand = require("../models/Brand");

router.get("/dashboard/stats", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      totalBrands,
      recentOrders,
      lowStockProducts,
      revenueData,
      ordersByStatus,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ Role: "user" }),
      Category.countDocuments(),
      Brand.countDocuments(),
      Order.find()
        .populate("userid", "Email")
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ stock: { $lte: 10, $gt: 0 } })
        .select("Productname stock price")
        .limit(5),
      Order.aggregate([
        { $match: { paymentstatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalamount" } } },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentstatus: "paid" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalamount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalCategories,
        totalBrands,
        totalRevenue,
      },
      recentOrders,
      lowStockProducts,
      monthlyRevenue,
      ordersByStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;