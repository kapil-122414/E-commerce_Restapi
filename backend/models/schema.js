const { Schema, model } = require("mongoose");

const categoryschema = new Schema(
  {
    Img: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    Categoryname: {
      type: String,
      required: true,
    },

    Slug: {
      type: String,
      required: true,
    },

    Status: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("category", categoryschema);
