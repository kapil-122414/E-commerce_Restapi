const { Schema, model, default: mongoose } = require("mongoose");

const orderd = new Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        productid: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "products",
        },
        name: String,
        price: Number,
        quantity: Number,
        totalPrice: Number,
      },
    ],

    totalamount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    paymentstatus: {
      type: String,
      default: "panding",
    },
  },

  {
    timestamps: true,
  },
);

module.exports = model("orders", orderd);
