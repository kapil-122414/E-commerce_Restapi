const express = require("express");
const router = express.Router();
const carts = require("../models/Cartsmodels");
const authmiddleware = require("../Middlerware/authmiddleware");
router.post("/carts", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    console.log(userid);
    const { ProductId, variants } = req.body;

    const newdata = await carts.create({
      UserId: userid,
      ProductId,
      variants,
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
      return res.json({ message: "user not valid" });
    }
    const cartsId = await carts
      .findOne({ UserId: Userid })
      .populate("ProductId");
    res.json({ message: "success", cartsId });
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

    const result = await carts.deleteMany({ userId });

    res.json({ message: "All cart items deleted", result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
