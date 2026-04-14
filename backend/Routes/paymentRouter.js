const express = require("express");
const router = express.Router();
const PAYMENTS = require("../models/Paymentmodel"); //is me schema h
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
    } = req.body;

    const userId = req.user.id;
    const orderData = await order.findOne({ _id: orderId, userid: userId });

    if (!orderData) {
      return res.status(404).json({ message: "orderd not found" });
    }

    const testemode = true;
    if (!testemode) {
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
    }
    const existingPayment = await PAYMENTS.findOne({
      paymentid: razorpay_payment_id,
    });
    
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already recorded",
      });
    }

    const Payments = await PAYMENTS.create({
      userId,
      amount: orderData.totalamount,
      orderId,
      paymentid: razorpay_payment_id || "testing Payment",
      orderdpaymentid: razorpay_order_id || "testing order",
      signature: razorpay_signature || "testing signature",

      status: "completed",
    });

    await order.findByIdAndUpdate(orderId, {
      paymentStatus: "completed",
      status: "confirmed",
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      Payments,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
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

module.exports = router;
