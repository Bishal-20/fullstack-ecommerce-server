const subCategory = require('../models/subCat');
const express = require("express");
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category) {
      filter.category = category; // filter by category id
    }
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 7; 

    const total = await subCategory.countDocuments();
    const totalPages = Math.ceil(total / perPage);

    if (page > totalPages && totalPages !== 0) {
      return res.status(404).json({ message: "Page not found" });
    }


      const subCategoryList = await subCategory.find(filter).populate({
      path: "category",
      select: "name images",
      populate: {
        path: "images",
      }
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.json({ subCategoryList, totalPages, page });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/" , async (req, res) => {

    try {
  const subCat = new subCategory({
    category: req.body.category,
    subCat: req.body.subCat,
  });

  const savedSubCategory = await subCat.save();

  if (!savedSubCategory) {
    return res.status(500).json({ success: false, message: "Failed to save" });
  }

  res.status(201).json(savedSubCategory);
} catch (err) {
  res.status(500).json({ success: false, message: err.message });
}

});


router.get("/:id", async (req, res) => {
  try {
    const subCat = await subCategory.findById(req.params.id).populate('category');
    if (!subCat)
      return res.status(404).json({ message: "SubCategory not found" });

    res.json(subCat);

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const subCat = await subCategory.findById(req.params.id);
    if (!subCat) return res.status(404).json({ message: "Not found" });


   subCat.category = req.body.category;
   subCat.subCat = req.body.subCat;

    await subCat.save();
    res.json(subCat);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const subCat = await subCategory.findById(req.params.id);

    if (!subCat)
      return res.status(404).json({ message: "SubCategory not found" });

    await subCat.deleteOne();

    res.json({ success: true, message: "SubCategory deleted" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports= router;