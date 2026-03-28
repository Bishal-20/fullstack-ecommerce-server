const express = require("express");
const HomeBanner = require("../models/homeBanner");
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


router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    const imageUrls = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "homeBanners",
      });

      fs.unlinkSync(file.path);

      imageUrls.push(result.secure_url);  // ✅ store string
    }

    const newEntry = new HomeBanner({
      images: imageUrls   // array of strings
    });

    const savedHomebanner = await newEntry.save();
    res.status(201).json(savedHomebanner);

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const bannerImagesList = await HomeBanner.find()

    res.json(bannerImagesList);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const slideItem = await HomeBanner.findById(req.params.id);

    if (!slideItem) return res.status(404).json({ message: "HomeBanner not found" });
    res.json(slideItem);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



/**
 * UPDATE CATEGORY
 */
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const slideItem = await HomeBanner.findById(req.params.id);

    if (!slideItem) {
      return res.status(404).json({ message: "HomeBanner not found" });
    }

    // If new images uploaded → replace old ones
    if (req.files && req.files.length > 0) {

      const newImageUrls = [];

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "homeBanners",
        });

        fs.unlinkSync(file.path);

        newImageUrls.push(result.secure_url);
      }

      // Replace entire images array
      slideItem.images = newImageUrls;
    }

    await slideItem.save();
    res.json(slideItem);

  } catch (err) {
    console.error("UPDATE HomeBanner ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE CATEGORY
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedItem = await HomeBanner.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: "HomeBanner not found" });
    }

    res.json({
      success: true,
      message: "HomeBanner deleted successfully",
    });

  } catch (err) {
    console.error("DELETE HomeBanner ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
