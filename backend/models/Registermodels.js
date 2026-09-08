const { Schema, model } = require("mongoose");

const registerschma = new Schema({
  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  Password: {
    type: String,
    required: true,
    minlength: 8,
  },
  Role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
});
module.exports = model("register", registerschma);
