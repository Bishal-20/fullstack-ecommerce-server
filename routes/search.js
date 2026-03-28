const Product = require('../models/product');
const Category = require('../models/category');
const express = require ('express');
const router = express.Router();
const mongoose = require ('mongoose');

router.get('/', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ msg: "Query is required" });
    }

    const matchedCategories = await Category.find({
      name: { $regex: query, $options: "i" }
    });

    const categoryIds = matchedCategories.map(cat => cat._id);

    const items = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { category: { $in: categoryIds } }
      ]
    })
    .populate("images")
    .populate("category");

    res.json({ items });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});



module.exports = router;