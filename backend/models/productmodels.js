const { Schema, moded, default: mongoose, model } = require("mongoose");

const productschema = new Schema(
  {
    Productname: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      max: 100,
      min: 0,
      required: true,
    },
    Description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    shortdiscription: {
      type: String,
    },
    mrp: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    price: {
      type: Number,
    },
    brand: {
      type: String,
    },
    status: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    Img: {
      url: String,
      public_id: String,
    },
    variant: [
      {
        imges: {
          url: String,
          public_id: String,
        },
        size: String,
        colour: String,
        price1: {
          type: Number,
          min: 0,
          max: 100,
        },
        stock: {
          type: Number,
          min: 0,
        },
        sku: {
          type: String,
          unique: true,
        },
        mrp1: Number,

        discount1: Number,
      },
    ],
    reviws: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: Number,
        Comment: String,
      },
    ],
    averagerating: {
      type: Number,
    },
    totalreviews: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("Product", productschema);
