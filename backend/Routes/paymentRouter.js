const express = require("express");
const router = express.Router();
const PAYMENTS = require("../models/Paymentmodel");
const order = require("../models/orderdmodels");
const crypto = require("crypto");
const authmiddleware = require("../Middlerware/authmiddleware");
const razorpay = require("../config/razorpay");

router.post("/payment/verify", authmiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentmethod,
      paymentstatus,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    const userId = req.user.id;
    const orderData = await order
      .findOne({ _id: orderId, userid: userId })
      .populate("shippingAddress");

    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const existingPayment = await PAYMENTS.findOne({
      paymentid: razorpay_payment_id,
    }).populate({
      path: "orderId",
      populate: {
        path: "shippingAddress",
      },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already recorded",
      });
    }

    let paymentData = {
      userId,
      amount: orderData.totalamount,
      orderId,
      orderdpaymentid: razorpay_order_id,
      shippingAdress: orderData.shippingAddress._id,
      paymentmethod: paymentmethod,
      paymentstatus: paymentstatus || "pending",
    };

    if (paymentmethod === "COD") {
      paymentData.paymentid = "COD_" + Date.now();
      paymentData.signature = "COD";
    } else if (paymentmethod === "upi" || paymentmethod === "card") {
      paymentData.paymentid = razorpay_payment_id;
      paymentData.signature = razorpay_signature;
      paymentData.status = "completed";
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const Payments = await PAYMENTS.create(paymentData);

    await order.findByIdAndUpdate(orderId, {
      paymentstatus: "paid",
      status: "confirmed",
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      Payments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Payment verification failed",
    });
  }
});

router.post("/payment/:orderid", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    const orderid = req.params.orderid;
    const orderdta = await order.findOne({ userid: userid, _id: orderid });

    if (!orderdta) {
      return res.status(404).json({ message: "order not found" });
    }
    const amount = orderdta.totalamount;

    if (!amount) {
      return res.status(404).json({ message: "total amount not found" });
    }
    const option = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${orderid}`,
    };
    const razorpayOrder = await razorpay.orders.create(option);
    res.status(200).json({
      success: true,
      message: "Razorpay order created",
      razorpayOrder,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/payments", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let search = req.query.search || "";
    let status = req.query.status || "";

    const matchStage = {};

    if (status) {
      matchStage.status = status;
    }

    const data = await PAYMENTS.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderId",
        },
      },
      { $unwind: "$orderId" },

      {
        $match: {
          ...(status && { status }),
          ...(search && {
            "orderId.shippingAddress.name": {
              $regex: search,
              $options: "i",
            },
          }),
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.json({
      data,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
