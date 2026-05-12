const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');
require('dotenv').config();
const authJwt = require('./helper/jwt.js');
app.use(cors({
  origin: [
    "https://6a0300ffbce4cca6418ecded--bazzar-buddyadmin.netlify.app",
    "https://bazzarbuddystore.netlify.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type" , "Authorization"]
}));

// Body parser
app.use(bodyParser.json());

// Static folder for uploaded files
app.use("/uploads", express.static("uploads"));

// Import routes
const categoryRoutes = require('./routes/category');
const subCatRoutes = require('./routes/subCat'); // make sure this exports a router
const productRoutes = require('./routes/product');
const productWeightRoutes = require('./routes/productWeight');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');
const reviewRoutes = require('./routes/productReview');
const wishlistRoutes = require('./routes/myList');
const ordersRoutes = require('./routes/orders');
const homeBannerRoutes = require('./routes/homeBanner');
const searchRoutes = require('./routes/search');
const dashboardRoutes = require('./routes/dashboard');

// Public routes (no JWT required)
app.use('/api/search', searchRoutes);
app.use('/api/user', userRoutes);


// Protected routes (JWT required)
app.use('/api/category', categoryRoutes);
app.use('/api/subCat', subCatRoutes);
app.use('/api/product', productRoutes);
app.use('/api/productWeight',productWeightRoutes);
app.use('/api/cart', authJwt(), cartRoutes);
app.use('/api/productReview', authJwt(), reviewRoutes);
app.use('/api/wishlist', authJwt(), wishlistRoutes);
app.use('/api/orders', authJwt(), ordersRoutes);
app.use('/api/homeBanner', homeBannerRoutes);
app.use('/api/dashboard', authJwt(), dashboardRoutes);

const buildPath = path.join(__dirname, "../client/build");

app.use(express.static(buildPath));

app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(buildPath, "index.html"));
});

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Database connection established');

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
})
.catch(err => console.error("Database connection error:", err));

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Unauthorized access" });
  }
  console.error(err);
  res.status(500).json({ message: err.message });
});
