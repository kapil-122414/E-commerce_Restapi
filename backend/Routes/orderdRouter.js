const express = require("express");
const router = express.Router();
const orders = require("../models/orderdmodels");
const carts = require("../models/Cartsmodels");
const authmiddleware = require("../Middlerware/authmiddleware");
const user = require("../models/Registermodels");

router.post("/order", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    const { shippingaddress, shippingCost, discount } = req.body;

    const cartitems = await carts
      .find({ UserId: userid })
      .populate("ProductId");

    if (!cartitems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!shippingaddress || !shippingaddress.name || !shippingaddress.address) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    let totalamount = 0;
    const orderditem = cartitems.map((item) => {
      const totalprice = item.totalprice || item.price * item.Quantity;
      totalamount += totalprice;

      return {
        product: item.ProductId._id,
        name: item.ProductId?.Productname,
        price: item.ProductId.price,
        Quantity: item.Quantity,
        totalprice,
      };
    });

    const shippingCostNum = Number(shippingCost) || 0;
    const discountNum = Number(discount) || 0;
    const grandTotal = totalamount + shippingCostNum - discountNum;

    const newOrder = await orders.create({
      userid,
      items: orderditem,
      totalamount: grandTotal,
      shippingCost: shippingCostNum,
      discount: discountNum,
      shippingAddress: shippingaddress,
    });

    await carts.deleteMany({ UserId: userid });
    const totalorder = await orders.countDocuments({ userid });

    res
      .status(201)
      .json({ message: "Order placed successfully", newOrder, totalorder });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order" });
  }
});

router.get("/order", authmiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const filter = {
      userid: req.user.id,
    };
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter["shippingAddress.name"] = { $regex: search, $options: "i" };
    }

    const data = await orders
      .find(filter)
      .populate("shippingAddress")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await orders.countDocuments(filter);

    res.status(200).json({
      message: "success",
      data: data,
      page,
      totalPages: Math.ceil(total / limit),
      totalData: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.delete("/order/:id", authmiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const userid = req.user.id;

    const deletedta = await orders.findOneAndDelete({ _id: id, userid });

    if (!deletedta) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order" });
  }
});

router.patch("/order/:id", authmiddleware, async (req, res) => {
  try {
    const validation = ["placed", "shipped", "delivered", "cancelled"];
    const orderid = req.params.id;
    const { status } = req.body;

    if (!validation.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateorder = await orders.findOneAndUpdate(
      { _id: orderid, userid: req.user.id },
      { status },
      { new: true },
    );

    if (!updateorder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "success", updateorder });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order" });
  }
});

router.get("/order/:id", authmiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await orders
      .findOne({ _id: id, userid: req.user.id })
      .populate("shippingAddress")
      .populate("items.productid");

    if (!data) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

/// show the data in admin

router.get("/all-orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "-createdAt";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        {
          "shippingAddress.name": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate && startDate.trim() !== "") {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate && endDate.trim() !== "") {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          filter.createdAt.$lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const total = await orders.countDocuments(filter);

    const sortObj = {};
    if (sort.startsWith("-")) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const allorder = await orders
      .find(filter)
      .populate("userid", "Email Role")
      .populate("items.productid")
      .sort(sortObj)
      .limit(limit)
      .skip(skip);

    return res.status(200).json({
      allorder,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

router.get("/admin/order", authmiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "-createdAt";
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const users = await user
        .find({
          Email: { $regex: search, $options: "i" },
        })
        .select("_id");

      const userIds = users.map((item) => item._id);

      filter.$or = [
        {
          "shippingAddress.name": {
            $regex: search,
            $options: "i",
          },
        },
        {
          userid: {
            $in: userIds,
          },
        },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate && startDate.trim() !== "") {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.createdAt.$gte = start;
        }
      }
      if (endDate && endDate.trim() !== "") {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          filter.createdAt.$lte = end;
        }
      }
      // Remove createdAt filter if no valid dates
      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    const total = await orders.countDocuments(filter);

    const sortObj = {};
    if (sort.startsWith("-")) {
      sortObj[sort.substring(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const allorder = await orders
      .find(filter)
      .populate("userid", "Email Role")
      .populate("items.productid")
      .sort(sortObj)
      .limit(limit)
      .skip(skip);

    return res.status(200).json({
      allorder,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

router.get("/admin/order/:id", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const id = req.params.id;
    const data = await orders
      .findById(id)
      .populate("userid", "Email")
      .populate("items.productid");

    if (!data) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

router.patch("/admin/order/:id", authmiddleware, async (req, res) => {
  try {
    if (req.user.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const id = req.params.id;
    const updateData = req.body;

    if (updateData.shippingAddress) {
      if (updateData.shippingAddress.Phoneno) {
        updateData.shippingAddress.Phoneno = Number(
          updateData.shippingAddress.Phoneno,
        );
      }
      if (updateData.shippingAddress.pinecode) {
        updateData.shippingAddress.pinecode = Number(
          updateData.shippingAddress.pinecode,
        );
      }
    }
    if (updateData.shippingCost !== undefined)
      updateData.shippingCost = Number(updateData.shippingCost);
    if (updateData.discount !== undefined)
      updateData.discount = Number(updateData.discount);

    const updatedOrder = await orders
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate("userid", "Email")
      .populate("items.productid");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order" });
  }
});

module.exports = router;
