const { Schema, model, default: mongoose } = require("mongoose");
const Brandschema = new Schema(
  {
    Img: {
      url: String,
      public_id: String,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = model("Brand", Brandschema);
