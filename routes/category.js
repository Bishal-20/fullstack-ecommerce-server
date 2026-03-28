const express = require("express");
const Category = require("../models/category");
const multer = require("multer");

const fs = require("fs");
const path = require("path");


const router = express.Router();

const cloudinary = require('cloudinary').v2;

const ImageUpload = require("../models/imageUpload");

cloudinary.config({
  cloud_name:process.env.cloudinary_Config_Cloud_Name,
  api_key:process.env.cloudinary_Config_api_key,
  api_secret:process.env.cloudinary_Config_api_secret,
  secure:true

});

console.log("Cloudinary config:", process.env.cloudinary_Config_Cloud_Name, process.env.cloudinary_Config_api_key ? "OK" : "MISSING");

/**
 * MULTER CONFIG (TEMP STORAGE)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

/**
 * CREATE CATEGORY
 */
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    const imageDocs = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "categories",
      });
      console.log("Uploaded to cloudinary:", file.path);

      fs.unlinkSync(file.path);
      console.log("Deleted locally:", file.path);

      const imgDoc = await ImageUpload.create({
        images: [{ url: result.secure_url, public_id: result.public_id }]
      });

      imageDocs.push(imgDoc._id);
    }

    const category = new Category({
      name: req.body.name,
      color: req.body.color,
      images: imageDocs
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ALL CATEGORIES
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 7;

    const total = await Category.countDocuments();
    const totalPages = Math.ceil(total / perPage);

    if (page > totalPages && totalPages !== 0) {
      return res.status(404).json({ message: "Page not found" });
    }

    const categories = await Category.find()
      .populate({ path: "images", select: "images" })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json({ categoryList: categories, totalPages, page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});




// GET CATEGORY BY ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate({
      path: "images",
      select: "images",
    });

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * UPDATE CATEGORY
 */
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("images");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update basic fields
    category.name = req.body.name;
    category.color = req.body.color;

    // If new images are uploaded → REPLACE old ones
    if (req.files && req.files.length > 0) {

      // 1. Delete old images from Cloudinary + DB
      for (const imageDoc of category.images) {
        for (const img of imageDoc.images) {
          await cloudinary.uploader.destroy(img.public_id);
        }
        await ImageUpload.findByIdAndDelete(imageDoc._id);
      }

      // 2. Upload new images
      const newImageDocs = [];

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "categories",
        });

        fs.unlinkSync(file.path);

        const imgDoc = await ImageUpload.create({
          images: [{ url: result.secure_url, public_id: result.public_id }]
        });

        newImageDocs.push(imgDoc._id);
      }

      category.images = newImageDocs;
    }

    await category.save();
    res.json(category);

  } catch (err) {
    console.error("UPDATE CATEGORY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE CATEGORY
 */
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("images");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Loop through ImageUpload documents
    for (const imageDoc of category.images) {
      // Each imageDoc contains an array: imageDoc.images
      for (const img of imageDoc.images) {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(img.public_id);
      }

      // Delete ImageUpload document
      await ImageUpload.findByIdAndDelete(imageDoc._id);
    }

    // Finally delete the category
    await Category.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Category and images deleted successfully" });

  } catch (err) {
    console.error("DELETE CATEGORY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
