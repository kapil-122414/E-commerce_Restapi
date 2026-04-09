const { Schema, model, default: mongoose, Mongoose } = require("mongoose");
const carts = new Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userId",
    },
    ProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    variants: [
      {
        Size: String,
        Color: String,
        Quantity: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = model("cart", carts);
