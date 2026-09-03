const express = require("express");
const router = express.Router();
const Product = require("../models/productmodels");
const Order = require("../models/orderdmodels");
const User = require("../models/Registermodels");
const Category = require("../models/schema");
const Brand = require("../models/Brand");
const authmiddleware = require("../Middlerware/authmiddleware");
const mongoose = require("mongoose");

router.get("/global-search", authmiddleware, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          orders: [],
          customers: [],
          categories: [],
          brands: [],
        },
      });
    }

    const searchTerm = q.trim();
    const searchRegex = { $regex: searchTerm, $options: "i" };
    const searchLimit = parseInt(limit) || 10;
    const perTypeLimit = Math.ceil(searchLimit / 5);

    const isValidObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
    const objectIdSearch = isValidObjectId ? { _id: searchTerm } : null;

    // Also search for short order ID format (e.g., ORD-10245)
    const shortOrderIdMatch = searchTerm.match(/^ORD[-]?([a-fA-F0-9]{8,24})$/i);
    const shortOrderIdSearch = shortOrderIdMatch ? { _id: shortOrderIdMatch[1] } : null;

    // Get brand IDs that match the search term for product brand search
    const matchingBrands = await Brand.find({ name: searchRegex }).select("_id").lean();
    const brandIds = matchingBrands.map(b => b._id);

    const [products, orders, customers, categories, brands] = await Promise.all([
      Product.find({
        $or: [
          { Productname: searchRegex },
          { slug: searchRegex },
          { "variant.sku": searchRegex },
          ...(brandIds.length > 0 ? [{ brand: { $in: brandIds } }] : []),
        ],
      })
        .populate("brand", "name")
        .populate("categoryId", "Categoryname")
        .limit(perTypeLimit)
        .lean(),

      Order.find({
        $or: [
          ...(objectIdSearch ? [objectIdSearch] : []),
          ...(shortOrderIdSearch ? [shortOrderIdSearch] : []),
          { "shippingAddress.name": searchRegex },
        ],
      })
        .populate("userid", "Email")
        .limit(perTypeLimit)
        .lean(),

      User.find({
        Role: "user",
        $or: [
          { Email: searchRegex },
        ],
      })
        .select("-Password")
        .limit(perTypeLimit)
        .lean(),

      Category.find({
        $or: [
          { Categoryname: searchRegex },
          { Slug: searchRegex },
        ],
      })
        .limit(perTypeLimit)
        .lean(),

      Brand.find({
        name: searchRegex,
      })
        .limit(perTypeLimit)
        .lean(),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p._id,
      type: "product",
      title: p.Productname,
      subtitle: p.brand?.name ? `Brand: ${p.brand.name}` : p.categoryId?.Categoryname ? `Category: ${p.categoryId.Categoryname}` : "Product",
      sku: p.variant?.[0]?.sku,
      slug: p.slug,
      image: p.Img?.url,
      url: `/products`,
      searchTerm: p.Productname,
    }));

    const formattedOrders = orders.map((o) => ({
      id: o._id,
      type: "order",
      title: `Order #${o._id.toString().slice(-8).toUpperCase()}`,
      subtitle: `Customer: ${o.shippingAddress?.name || o.userid?.Email} | Status: ${o.status}`,
      status: o.status,
      customerEmail: o.userid?.Email,
      url: `/orders`,
      searchTerm: o.shippingAddress?.name || o.userid?.Email || "",
    }));

    const formattedCustomers = customers.map((c) => ({
      id: c._id,
      type: "customer",
      title: c.Email,
      subtitle: "Customer",
      email: c.Email,
      url: `/customers`,
      searchTerm: c.Email,
    }));

    const formattedCategories = categories.map((cat) => ({
      id: cat._id,
      type: "category",
      title: cat.Categoryname,
      subtitle: `Slug: ${cat.Slug}`,
      slug: cat.Slug,
      url: `/categories`,
      searchTerm: cat.Categoryname,
    }));

    const formattedBrands = brands.map((b) => ({
      id: b._id,
      type: "brand",
      title: b.name,
      subtitle: "Brand",
      url: `/brands`,
      searchTerm: b.name,
    }));

    const allResults = [
      ...formattedProducts,
      ...formattedOrders,
      ...formattedCustomers,
      ...formattedCategories,
      ...formattedBrands,
    ].slice(0, searchLimit);

    res.status(200).json({
      success: true,
      data: {
        all: allResults,
        products: formattedProducts,
        orders: formattedOrders,
        customers: formattedCustomers,
        categories: formattedCategories,
        brands: formattedBrands,
        total: allResults.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;