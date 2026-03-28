const SubCategory = require("../models/subCat.js");
const Product = require("../models/product.js");
const RecentlyViewedProduct = require("../models/recentlyViewedProducts.js");
const ImageUpload = require("../models/imageUpload");
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get(`/`, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const { subCatName, catId, catName, minPrice, maxPrice, brand, location } =
      req.query;

    let filter = {};

    if (catId && mongoose.Types.ObjectId.isValid(catId)) {
      filter.category = catId;
    }

    if (catName) {
      const category = await require("../models/category").findOne({
        name: { $regex: catName, $options: "i" },
      });

      if (!category) {
        return res.json({ productList: [], totalPages: 0, page });
      }

      filter.category = category._id;
    }

    if (subCatName) {
      const subCategory = await SubCategory.findOne({
        subCat: { $regex: subCatName, $options: "i" },
      });

      if (!subCategory) {
        return res.json({ productList: [], totalPages: 0, page });
      }

      filter.subCat = subCategory._id;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (brand) {
      filter.brand = brand;
    }
    if (location && location !== "All" && location !== "null") {
      filter.location = location;
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / perPage);
    if (page > totalPages && totalPages !== 0) {
      return res.status(404).json({ message: "Page not found" });
    }
    const productList = await Product.find(filter)
      .populate("category")
      .populate("subCat")
      .populate("productWeight")
      .populate({ path: "images", select: "images" })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.json({ productList, totalPages, page });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get(`/featured`, async (req, res) => {
  try {
    const filter = { isFeatured: true };

    if (req.query.location && req.query.location !== "All") {
      filter.location = req.query.location;
    }

    const productList = await Product.find(filter).populate({
      path: "images",
      select: "images",
    });

    return res.status(200).json(productList);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get(`/recentlyViewed`, async (req, res) => {
  try {
    const productList = await RecentlyViewedProduct.find()
      .populate("category")
      .populate("subCat")
      .populate("productWeight")
      .populate({ path: "images", select: "images" });
    res.json({ productList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/recentlyViewed", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let findProduct = await RecentlyViewedProduct.findOne({ prodId: id });

    if (findProduct) {
      // OPTIONAL: update date so it moves to top
      findProduct.dateCreated = Date.now();
      await findProduct.save();

      return res.status(200).json(findProduct); // ✅ IMPORTANT
    }

    const product = await Product.findById(id)
      .populate({ path: "images", select: "images" })
      .populate("category")
      .populate("subCat")
      .populate("productWeight");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const recentlyViewed = new RecentlyViewedProduct({
      prodId: id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      price: product.price,
      oldPrice: product.oldPrice,
      countInStock: product.countInStock,
      rating: product.rating,
      isFeatured: product.isFeatured,
      discount: product.discount,
      category: product.category?._id,
      subCat: product.subCat?._id,
      productWeight: product.productWeight?.map((w) => w._id),
      images: product.images?._id,
    });

    const savedProduct = await recentlyViewed.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category")
    .populate("subCat")
    .populate("productWeight")
    .populate({
      path: "images",
      select: "images",
    });
  if (!product) {
    res
      .status(500)
      .json({ message: "The product with the given ID was not found." });
  }
  return res.status(200).send(product);
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id).populate("images");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageDoc = await ImageUpload.findById(product.images);

    if (imageDoc) {
      // Delete images from Cloudinary
      for (const img of imageDoc.images) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      // Delete ImageUpload document
      await ImageUpload.findByIdAndDelete(imageDoc._id);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/create", upload.array("images", 10), async (req, res) => {
  try {
    const {
      name,
      subCat,
      description,
      brand,
      price,
      oldPrice,
      category,
      countInStock,
      rating,
      isFeatured,
      discount,
      productWeight,
      location,
    } = req.body;

    if (
      !name ||
      !description ||
      !category ||
      !subCat ||
      !countInStock ||
      !discount
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "products",
      });

      fs.unlinkSync(file.path);

      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    const imageDoc = await ImageUpload.create({
      images: uploadedImages,
    });

    const images = imageDoc._id;

    const product = new Product({
      name,
      subCat,
      description,
      images,
      brand,
      price,
      oldPrice,
      category,
      countInStock,
      rating,
      isFeatured,
      discount,
      productWeight,
      location: Array.isArray(location) ? location : [location],
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("subCat")
      .populate("productWeight")
      .populate("images");
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    if (req.files && req.files.length > 0) {
      const imageDoc = await ImageUpload.findById(product.images);

      if (imageDoc) {
        for (const img of imageDoc.images) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        fs.unlinkSync(file.path);

        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }

      await ImageUpload.findByIdAndUpdate(product.images, {
        images: uploadedImages,
      });
    }

    product.name = req.body.name;
    product.subCat = req.body.subCat;
    product.description = req.body.description;
    product.brand = req.body.brand;
    product.price = req.body.price;
    product.oldPrice = req.body.oldPrice;
    product.category = req.body.category;
    product.countInStock = req.body.countInStock;
    product.rating = req.body.rating;
    product.isFeatured = req.body.isFeatured;
    product.discount = req.body.discount;
    product.productWeight = req.body.productWeight;
    product.location = req.body.location || [];

    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

module.exports = router;
