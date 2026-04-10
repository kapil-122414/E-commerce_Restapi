const express = require("express");
const router = express.Router();
const orders = require("../models/orderdmodels");
const carts = require("../models/Cartsmodels");
const authmiddleware = require("../Middlerware/authmiddleware");

router.post("/order", authmiddleware, async (req, res) => {
  try {
    const userid = req.user.id;
    const cartitems = await carts
      .find({ UserId: userid })

      .populate("ProductId");
    if (!cartitems.length) {
      return res.status(404).json({ message: "cartitems is not" });
    }
    let totalamount = 0;
    const orderditem = cartitems.map((item) => {
      const totalprice = item.totalprice || item.price * item.Quality;
      totalamount += totalprice;

      console.log(totalamount);
      return {
        product: item.ProductId,
        name: item.ProductId?.Productname,
        price: item.ProductId.price,
        Quantity: item.Quantity,
        totalprice,
      };
    });
    const newOrder = await orders.create({
      userid,
      items: orderditem,
      totalamount,
    });
    const deletdata = await carts.deleteMany({ UserId: userid });
    console.log(deletdata);

    res.status(200).json({ message: "orderd place successfuly", newOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
