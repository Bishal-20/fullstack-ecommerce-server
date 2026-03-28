const express = require("express");
const router = express.Router();

const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/orders");
const Review = require("../models/productReviews");

router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();

    const orders = await Order.find();

    const totalSales = orders.reduce((sum, order) => {
      return sum + Number(order.amount) / 100;
    }, 0);

    res.json({
      users: totalUsers,
      orders: totalOrders,
      products: totalProducts,
      reviews: totalReviews,
      sales: totalSales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
router.get("/sales-chart", async (req, res) => {
  try {

    const sales = await Order.aggregate([
      {
        $addFields: {
          amountNumber: { $toDouble: "$amount" }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amountNumber" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const formatted = sales.map(item => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      value: item.total / 100
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
