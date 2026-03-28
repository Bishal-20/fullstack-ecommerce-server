const express = require("express");
const Cart = require("../models/cart");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cartList = await Cart.find(req.query);
    if (!cartList) {
      return res.status(500).json({ success: false });
    }

    return res.status(200).json(cartList);
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.post("/add", async (req, res) => {
  const cartItem = await Cart.findOne({
    productId: req.body.productId,
    userId: req.body.userId,
  });
  if (!cartItem) {
    let cartList = new Cart({
      productTitle: req.body.productTitle,
      images: req.body.images,
      rating: req.body.rating,
      price: req.body.price,
      quantity: req.body.quantity,
      subTotal: req.body.subTotal,
      productId: req.body.productId,
      userId: req.body.userId,
    });

    if (!cartList) {
      res.status(500).json({
        error: err,
        sucess: false,
      });
    }

    cartList = await cartList.save();
    res.status(200).json(cartList);
  } else {
    res
      .status(409)
      .json({ status: false, msg: "Product already added in the cart" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const cartList = await Cart.findByIdAndUpdate(
      req.params.id,
      {
        productTitle: req.body.productTitle,
        images: req.body.images,
        rating: req.body.rating,
        price: req.body.price,
        quantity: req.body.quantity,
        subTotal: req.body.subTotal,
        productId: req.body.productId,
        userId: req.body.userId,
      },
      { new: true },
    );

    if (!cartList) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ success: true, cartList });
  } catch (err) {
    console.error("UPDATE CART ITEM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const cartItem = await Cart.findById(req.params.id);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Finally delete the cart item
    await Cart.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Cart item deleted successfully" });
  } catch (err) {
    console.error("DELETE CART ITEM ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

module.exports = router;
