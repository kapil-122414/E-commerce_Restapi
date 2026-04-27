const { Schema, model, default: mongoose } = require("mongoose");

const categoryschema = new Schema(
  {
    Img: {
      type: String,
      require: true,
    },
    Categoryname: {
      type: String,
      required: true,
    },

    Slug: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
      required: true,
    },

    Order: {
      type: Number,
      required: true,
    },
    Status: {
      type: String,
      required: true,
    },
    Featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("category", categoryschema);
