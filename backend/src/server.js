const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const setupSecurity = require("./middleware/securityMiddleware");
const errorHandler = require("./middleware/error");

// Load environment variables
dotenv.config();

// Import route files
const addressRoutes = require("./routes/addressRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes"); // Unified cart routes
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const shoppingListRoutes = require("./routes/shoppingListRoutes");
const userRoutes = require("./routes/userRoutes");

// Initialize express app
const app = express();

// Body parser
app.use(express.json({ limit: "10kb" }));

// Cookie parser
app.use(cookieParser());

// Set up all security middleware
setupSecurity(app);

// Logging middleware in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Mount routes
app.use("/api/addresses", addressRoutes); // Changed from singular to plural for consistency
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes); // Unified cart routes
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shopping-lists", shoppingListRoutes); // Changed from singular to plural for consistency
app.use("/api/users", userRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Hot Fridge API is running");
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../../frontend", "dist", "index.html")
    );
  });
}

// Error handler middleware
app.use(errorHandler);

// Handle unhandled routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Connect to MongoDB with improved options
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true, // Needed for unique constraints and indexes
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Global error handler for unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});

// Start the server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle server errors
server.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  process.exit(1);
});