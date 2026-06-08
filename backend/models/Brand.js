const { Schema, model, default: mongoose } = require("mongoose");
const Brandschema = new Schema(
  {
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
