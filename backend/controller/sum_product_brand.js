const Brand = require("../models/Brand");
const Product = require("../models/productmodels");

const totalproduct = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(400).json({ message: "brand not found" });
    }
    const productcount = await Product.countDocuments({
      brand: id,
    });
    res.status(200).json({ brand, productcount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { totalproduct };
