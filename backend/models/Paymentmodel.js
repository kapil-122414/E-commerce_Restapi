const { mongoose } = require("mongoose");

const { Schema, model } = require("mongoose");

const payments = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentid: {
      type: String,
    },
    orderdpaymentid: {
      type: String,
    },
    signature: {
      type: String,
    },
    paymentmethod: {
      type: String,
      default: "COD",
    },
    paymentstatus: {
      type: String,
      default: "panding",
    },
    status: {
      type: String,
      default: "panding",
      enum: ["panding", "completed", "failed"],
    },
    shippingAdress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("payment", payments);
