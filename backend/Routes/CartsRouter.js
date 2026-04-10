const express = require("express");
const router = express.Router();
const carts = require("../models/Cartsmodels");
const product = require("../models/productmodels");
const authmiddleware = require("../Middlerware/authmiddleware");
router.post("/carts", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;

    const { ProductId, variants, Quantity } = req.body;
    const products = await product.findById(ProductId);

    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }

    const price = products.price;
    const newdata = await carts.create({
      UserId: userid,
      ProductId,
      variants,
      price,
      Quantity,
      totalprice: price * Quantity,
    });

    res.status(200).json({ message: "successfully", newdata });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/carts", authmiddleware, async (req, res) => {
  try {
    const Userid = req.user.id;
    if (!Userid) {
      return res.json({ message: "data not valid" });
    }
    const cartsitems = await carts
      .find({ UserId: Userid })
      .populate("ProductId", "Productname Img price");

    let grandTotal = 0;
    const updatedCart = cartsitems.map((item) => {
      const price = item.price || item.ProductId?.price;
      const Quantity = item.Quantity;
      const totalPrice = price * Quantity;

      grandTotal += totalPrice;

      return {
        _id: item._id,
        quantity: item.Quantity,
        price: item.price,
        totalPrice,

        // 🔥 product details
        product: {
          name: item.ProductId?.name,
          image: item.ProductId?.image,
        },
      };
    });

    res.json({ message: "success", items: updatedCart, grandTotal });
  } catch (error) {
    res.status(500).json({ meaage: error.message });
  }
});
//one cart delete
router.delete("/carts/:id", authmiddleware, async (req, res) => {
  try {
    const cartId = req.params.id;

    const deletedata = await carts.findByIdAndDelete(cartId);

    if (!deletedata) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Cart item deleted", deletedata });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//user data delete
router.delete("/carts", authmiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await carts.deleteMany({ UserId: userId });

    res.json({ message: "All cart items deleted", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//update data carts
router.patch("/carts/:_id", authmiddleware, async (req, res) => {
  try {
    const id = req.params._id;
    const data = req.body;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "data not valid" });
    }

    const cartItem = await carts.findById(id);
    const productprice = await product.findById(cartItem.ProductId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ✅ quantity direct field hai
    if (data.Quantity !== undefined) {
      cartItem.Quantity = data.Quantity;

      // 🔥 totalPrice update
      cartItem.totalprice = productprice.price * data.Quantity;
    }

    // ✅ variants safely update karo
    if (data.variants) {
      cartItem.variants = {
        ...cartItem.variants,
        ...data.variants,
      };
    }

    await cartItem.save();

    res.status(200).json({
      message: "update successfully",
      data: cartItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
