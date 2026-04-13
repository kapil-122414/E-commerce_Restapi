const express = require("express");
const router = express.Router();
const orders = require("../models/orderdmodels");
const carts = require("../models/Cartsmodels");
const authmiddleware = require("../Middlerware/authmiddleware");

router.post("/order", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    const cartitems = await carts
      .find({ UserId: userid })
      .populate("ProductId");
    if (!cartitems.length) {
      return res.status(404).json({ message: "cartitems is not" });
    }
    let totalamount = 0;
    const orderditem = cartitems.map((item) => {
      const totalprice = item.totalprice || item.price * item.Quality;
      totalamount += totalprice;

      console.log(totalamount);
      return {
        product: item.ProductId._id,
        name: item.ProductId?.Productname,
        price: item.ProductId.price,
        Quantity: item.Quantity,
        totalprice,
      };
    });
    const newOrder = await orders.create({
      userid,
      items: orderditem,
      totalamount,
    });
    const deletdata = await carts.deleteMany({ UserId: userid });

    res.status(200).json({ message: "orderd place successfuly", newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      filter["items.name"] = { $regex: search, $options: "i" };
    }

    const data = await orders
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await orders.countDocuments(filter);
    res.status(200).json({
      message: "success",
      data,
      page,
      totalPages: Math.ceil(total / limit),
      totalData: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/order/:id", authmiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const deletedta = await orders.findByIdAndDelete(id);

    res.status(200).json({ message: "successfuly", deletedta });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.patch("/order", authmiddleware, async (req, res) => {
  try {
    const validation = ["placed", "shipped", "deleverd", "cencelled"];
    const orderid = req.params.id;
    const { status } = req.body;
    const updateorder = await orders.findOneAndUpdate(
      { id: orderid, userid: req.user.id },
      { status },
      { new: true },
    );

    if (!updateorder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (!validation.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    res.status(200).json({ message: "success", updateorder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
