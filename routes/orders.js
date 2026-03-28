const express = require("express");
const router = express.Router();
const Order = require("../models/orders");


// CREATE ORDER
router.post("/create", async (req, res) => {
  try {

    const userId = req.auth.id; // taken from JWT

    let order = new Order({
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      pincode: req.body.pincode,
      amount: req.body.amount,
      paymentId: req.body.paymentId,
      email: req.body.email,
      userId: userId,
      products: req.body.products
    });

    order = await order.save();

    res.status(201).json({
      success: true,
      order: order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      msg: error.message
    });

  }
});



// GET ALL ORDERS FOR LOGGED-IN USER
router.get("/", async (req, res) => {
  try {

    const userId = req.auth.id;

    const orders = await Order
      .find({ userId: userId })
      .sort({ date: -1 });

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      msg: error.message
    });

  }
});



// GET SINGLE ORDER (USER CAN ONLY ACCESS THEIR OWN)
router.get("/:id", async (req, res) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.auth.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      msg: error.message
    });

  }
});



// UPDATE ORDER STATUS (ADMIN USE)
router.put("/:id", async (req, res) => {
  try {

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      msg: error.message
    });

  }
});



// DELETE ORDER (ADMIN)
router.delete("/:id", async (req, res) => {
  try {

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    res.json({
      success: true,
      msg: "Order deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      msg: error.message
    });

  }
});


module.exports = router;