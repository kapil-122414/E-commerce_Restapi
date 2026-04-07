const { Schema, moded, default: mongoose, model } = require("mongoose");

const productschema = new Schema(
  {
    Productname: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    Description: {
      type: String,
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    Img: {
      type: String,
      url: String,
      public_id: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("Product", productschema);
