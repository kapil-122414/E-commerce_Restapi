const { Schema, model, default: mongoose } = require("mongoose");

const payments = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "register",
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
      default: "pending",
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "failed"],
    },
    shippingAdress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("payment", payments);
