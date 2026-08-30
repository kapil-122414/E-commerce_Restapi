const express = require("express");
const router = express.Router();
const authmiddleware = require("../Middlerware/authmiddleware");
const User = require("../models/Registermodels");
const Order = require("../models/orderdmodels");

router.get("/admin/customers", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const filter = { Role: "user" };
    if (search) {
      filter.$or = [
        { Email: { $regex: search, $options: "i" } },
      ];
    }

    const sort = { [sortBy]: sortOrder };

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select("-Password")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ userid: customer._id });
        const totalOrders = orders.length;
        const totalSpent = orders
          .filter((o) => o.paymentstatus === "paid")
          .reduce((sum, o) => sum + o.totalamount, 0);
        const lastOrder = orders.length > 0 
          ? orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          : null;

        return {
          ...customer.toObject(),
          totalOrders,
          totalSpent,
          lastOrderDate: lastOrder?.createdAt,
          lastOrderStatus: lastOrder?.status,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: customersWithStats,
      page,
      totalPages: Math.ceil(total / limit),
      totalCustomers: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin/customers/:id", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const customer = await User.findById(req.params.id).select("-Password");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ userid: customer._id })
      .populate("items.productid")
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.paymentstatus === "paid")
      .reduce((sum, o) => sum + o.totalamount, 0);

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        totalOrders,
        totalSpent,
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/admin/customers/:id", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { Role, ...updateData } = req.body;
    const customer = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-Password");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/admin/customers/:id", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const customer = await User.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;