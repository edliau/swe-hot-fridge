const Product = require("../models/Product");

// Get all products with filtering, sorting, and pagination
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice)
        filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Filter for products on sale
    if (req.query.onSale === "true") {
      filter.isOnSale = true;
    }

    // Filter for in-stock products
    if (req.query.inStock === "true") {
      filter.inStock = true;
    }

    // Sort options
    const sortOptions = {};
    if (req.query.sort) {
      if (req.query.sort === "price-asc") sortOptions.price = 1;
      if (req.query.sort === "price-desc") sortOptions.price = -1;
      if (req.query.sort === "name-asc") sortOptions.name = 1;
      if (req.query.sort === "name-desc") sortOptions.name = -1;
      if (req.query.sort === "popular") sortOptions.popularity = -1;
      if (req.query.sort === "rating") sortOptions.averageRating = -1;
      if (req.query.sort === "newest") sortOptions.createdAt = -1;
    } else {
      // Default sorting
      sortOptions.createdAt = -1;
    }

    // Get filtered products
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error getting product by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    // Find product first to properly handle virtual properties
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    
    // Update only the fields that are provided
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.discountPrice !== undefined) product.discountPrice = req.body.discountPrice;
    if (req.body.isOnSale !== undefined) product.isOnSale = req.body.isOnSale;
    if (req.body.category) product.category = req.body.category;
    if (req.body.image) product.image = req.body.image;
    if (req.body.ingredients) product.ingredients = req.body.ingredients;
    if (req.body.stockQuantity !== undefined) product.stockQuantity = req.body.stockQuantity;
    if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured;
    
    // Handle nutritionalInfo updates if provided
    if (req.body.nutritionalInfo) {
      if (!product.nutritionalInfo) {
        product.nutritionalInfo = {};
      }
      
      if (req.body.nutritionalInfo.calories !== undefined) 
        product.nutritionalInfo.calories = req.body.nutritionalInfo.calories;
      if (req.body.nutritionalInfo.fat !== undefined) 
        product.nutritionalInfo.fat = req.body.nutritionalInfo.fat;
      if (req.body.nutritionalInfo.carbs !== undefined) 
        product.nutritionalInfo.carbs = req.body.nutritionalInfo.carbs;
      if (req.body.nutritionalInfo.protein !== undefined) 
        product.nutritionalInfo.protein = req.body.nutritionalInfo.protein;
      if (req.body.nutritionalInfo.sodium !== undefined) 
        product.nutritionalInfo.sodium = req.body.nutritionalInfo.sodium;
    }
    
    // Handle allergens if provided
    if (req.body.allergens) {
      product.allergens = req.body.allergens;
    }
    
    // Save the updated product
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add a new utility method to update stock quantity
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;
    
    if (stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity is required",
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    
    // Update the stock quantity
    product.stockQuantity = stockQuantity;
    
    // Save the product (inStock will be automatically determined by the virtual property)
    await product.save();
    
    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product stock:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Add a product rating/review
exports.addProductRating = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const userId = req.user.id; // Assuming authentication middleware sets req.user

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user has already rated this product
    const existingRatingIndex = product.ratings.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      product.ratings[existingRatingIndex].rating = rating;
      product.ratings[existingRatingIndex].review = review;
      product.ratings[existingRatingIndex].date = Date.now();
    } else {
      // Add new rating
      product.ratings.push({
        userId,
        rating,
        review,
        date: Date.now(),
      });
    }

    // Calculate new average rating
    product.averageRating =
      product.ratings.reduce((acc, item) => acc + item.rating, 0) /
      product.ratings.length;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product rating added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error adding product rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get product ratings
exports.getProductRatings = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "ratings.userId",
      "name avatar"
    ); // Populate user info

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      count: product.ratings.length,
      averageRating: product.averageRating,
      data: product.ratings,
    });
  } catch (error) {
    console.error("Error getting product ratings:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isFeatured: true })
      .sort({ popularity: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error getting featured products:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get products on sale
exports.getProductsOnSale = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({ isOnSale: true })
      .sort({ discountPercentage: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error getting products on sale:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
