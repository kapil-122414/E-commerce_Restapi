const express = require("express");
const router = express.Router();
const carts = require("../models/Cartsmodels");
const product = require("../models/productmodels");
const authmiddleware = require("../Middlerware/authmiddleware");

router.post("/carts", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    const { ProductId, variants, Quantity } = req.body;

    if (!ProductId || !Quantity || Quantity < 1) {
      return res.status(400).json({ message: "ProductId and Quantity (>=1) are required" });
    }

    const products = await product.findById(ProductId);

    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (products.stock < Quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
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

    const totalItems = await carts.countDocuments({
      UserId: userid,
    });

    res.status(201).json({ message: "Added to cart successfully", newdata, totalItems });
  } catch (error) {
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

router.get("/carts", authmiddleware, async (req, res) => {
  try {
    const Userid = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cartsitems = await carts
      .find({ UserId: Userid })
      .populate("ProductId", "Productname Img price")
      .skip(skip)
      .limit(limit);

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
        product: {
          name: item.ProductId?.Productname,
          image: item.ProductId?.Img?.url,
        },
      };
    });

    const total = await carts.countDocuments({ UserId: Userid });
    res.json({
      message: "success",
      items: updatedCart,
      grandTotal,
      page,
      totalpage: Math.ceil(total / limit),
      totaldata: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

//one cart delete
router.delete("/carts/:id", authmiddleware, async (req, res) => {
  try {
    const cartId = req.params.id;
    const userId = req.user.id;

    const deletedata = await carts.findOneAndDelete({ _id: cartId, UserId: userId });

    if (!deletedata) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Cart item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cart item" });
  }
});

//user data delete
router.delete("/carts", authmiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await carts.deleteMany({ UserId: userId });

    res.json({ message: "All cart items deleted", result });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

//update data carts
router.patch("/carts/:_id", authmiddleware, async (req, res) => {
  try {
    const id = req.params._id;
    const userId = req.user.id;
    const data = req.body;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "data not valid" });
    }

    const cartItem = await carts.findOne({ _id: id, UserId: userId });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productprice = await product.findById(cartItem.ProductId);

    if (!productprice) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (data.Quantity !== undefined) {
      if (data.Quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }
      if (productprice.stock < data.Quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      cartItem.Quantity = data.Quantity;
      cartItem.totalprice = productprice.price * data.Quantity;
    }

    if (data.variants) {
      cartItem.variants = {
        ...cartItem.variants,
        ...data.variants,
      };
    }

    await cartItem.save();

    res.status(200).json({
      message: "updated successfully",
      data: cartItem,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update cart" });
  }
});

module.exports = router;
