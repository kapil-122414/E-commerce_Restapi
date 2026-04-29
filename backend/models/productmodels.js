const { Schema, moded, default: mongoose, model } = require("mongoose");

const productschema = new Schema(
  {
    Productname: {
      type: String,
      required: true,
    },
    price: {
      type: Number,

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
      max: 100,
      min: 0,
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
        image: {
          url: String,
          public_id: String,
        },
        size: String,
        colour: String,
        price1: Number,
        stock: Number,
        sku: {
          type: String,
        },
        mrp1: Number,
        discount1: {
          type: Number,
          max: 100,
          min: 0,
        },
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
