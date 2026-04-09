const { Schema, model } = require("mongoose");

const registerschma = new Schema({
  Email: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
    unique: true,
  },
  Role: {
    type: String,
    default: "user",
  },
});
module.exports = model("register", registerschma);
