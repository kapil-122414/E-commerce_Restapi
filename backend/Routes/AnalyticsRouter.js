const express = require("express");
const router = express.Router();
const authmiddleware = require("../Middlerware/authmiddleware");
const Product = require("../models/productmodels");
const Order = require("../models/orderdmodels");
const User = require("../models/Registermodels");
const Category = require("../models/schema");

router.get("/analytics/stats", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      totalRevenueAgg,
      recentOrders,
      topProducts,
      monthlyRevenue,
      ordersByStatus,
      revenueComparison,
      ordersComparison,
      customersComparison,
      productsComparison,
      topCategories,
      avgOrderValue,
      conversionRate,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ Role: "user" }),
      Category.countDocuments(),
      Order.aggregate([
        { $match: { paymentstatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalamount" } } },
      ]),
      Order.find()
        .populate("userid", "Email")
        .sort({ createdAt: -1 })
        .limit(10),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { paymentstatus: "paid" } },
        {
          $group: {
            _id: "$items.productid",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            productName: "$product.Productname",
            totalSold: 1,
            revenue: 1,
            price: "$product.price",
          },
        },
      ]),
      Order.aggregate([
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
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        {
          $facet: {
            current: [
              { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentstatus: "paid" } },
              { $group: { _id: null, revenue: { $sum: "$totalamount" }, orders: { $sum: 1 } } },
            ],
            previous: [
              { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, paymentstatus: "paid" } },
              { $group: { _id: null, revenue: { $sum: "$totalamount" }, orders: { $sum: 1 } } },
            ],
          },
        },
      ]),
      Order.aggregate([
        {
          $facet: {
            current: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: "count" },
            ],
            previous: [
              { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
              { $count: "count" },
            ],
          },
        },
      ]),
      User.aggregate([
        {
          $facet: {
            current: [
              { $match: { createdAt: { $gte: thirtyDaysAgo }, Role: "user" } },
              { $count: "count" },
            ],
            previous: [
              { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, Role: "user" } },
              { $count: "count" },
            ],
          },
        },
      ]),
      Product.aggregate([
        {
          $facet: {
            current: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: "count" },
            ],
            previous: [
              { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
              { $count: "count" },
            ],
          },
        },
      ]),
      Order.aggregate([
        { $match: { paymentstatus: "paid" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "categories",
            localField: "items.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.Categoryname",
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { paymentstatus: "paid" } },
        { $group: { _id: null, avgOrderValue: { $avg: "$totalamount" } } },
      ]),
      Order.aggregate([
        {
          $facet: {
            totalVisitors: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: "count" },
            ],
            converted: [
              { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentstatus: "paid" } },
              { $count: "count" },
            ],
          },
        },
      ]),
    ]);

    const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

    const calculateTrend = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? "+100%" : "0%";
      const trend = ((current - previous) / previous) * 100;
      return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
    };

    const revenueCurrent = revenueComparison[0]?.current?.[0]?.revenue || 0;
    const revenuePrevious = revenueComparison[0]?.previous?.[0]?.revenue || 0;
    const ordersCurrent = ordersComparison[0]?.current?.[0]?.count || 0;
    const ordersPrevious = ordersComparison[0]?.previous?.[0]?.count || 0;
    const customersCurrent = customersComparison[0]?.current?.[0]?.count || 0;
    const customersPrevious = customersComparison[0]?.previous?.[0]?.count || 0;
    const productsCurrent = productsComparison[0]?.current?.[0]?.count || 0;
    const productsPrevious = productsComparison[0]?.previous?.[0]?.count || 0;

    const avgOrderVal = avgOrderValue[0]?.avgOrderValue || 0;
    const totalVisitors = conversionRate[0]?.totalVisitors?.[0]?.count || ordersCurrent;
    const converted = conversionRate[0]?.converted?.[0]?.count || ordersCurrent;
    const conversion = totalVisitors > 0 ? ((converted / totalVisitors) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalCategories,
        totalRevenue,
        avgOrderValue: avgOrderVal,
        conversionRate: parseFloat(conversion),
      },
      trends: {
        revenue: calculateTrend(revenueCurrent, revenuePrevious),
        orders: calculateTrend(ordersCurrent, ordersPrevious),
        customers: calculateTrend(customersCurrent, customersPrevious),
        products: calculateTrend(productsCurrent, productsPrevious),
      },
      recentOrders,
      topProducts,
      monthlyRevenue,
      ordersByStatus,
      topCategories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;