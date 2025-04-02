const Recommendation = require("../models/Recommendation");
const Product = require("../models/Product"); // Assuming you have a Product model
const User = require("../models/User"); // Assuming you have a User model

// Function to generate recommendations
exports.generateRecommendations = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL params
    const { type } = req.body; // Extract recommendation type from the request body

    // Validate the recommendation type
    if (
      !["personalized", "trending", "similar", "best_seller"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid recommendation type. Valid types are: personalized, trending, similar, best_seller.",
      });
    }

    // Get the user to ensure they exist
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let recommendations;

    // Generate recommendations based on the type
    if (type === "personalized") {
      // Personalized recommendations could be based on user activity, preferences, or purchase history
      recommendations = await Recommendation.find({ userId })
        .sort({ score: -1 }) // Sort by score in descending order to prioritize better recommendations
        .populate("productId"); // Populate product details
    } else if (type === "trending") {
      // Trending recommendations could be based on the most popular products
      recommendations = await Recommendation.find({ type: "trending" })
        .sort({ score: -1 })
        .populate("productId");
    } else if (type === "similar") {
      // Similar recommendations could be based on products related to the user's previous purchases
      const previousPurchases = await Recommendation.find({
        userId,
        type: "personalized",
      })
        .populate("productId")
        .limit(5); // Limit to 5 products the user interacted with
      const productIds = previousPurchases.map(
        (recommendation) => recommendation.productId._id
      );

      recommendations = await Recommendation.find({
        productId: { $in: productIds },
        type: "similar",
      })
        .sort({ score: -1 })
        .populate("productId");
    } else if (type === "best_seller") {
      // Best-seller recommendations could be based on products with the highest sales
      recommendations = await Product.find({}).sort({ sales: -1 }).limit(5); // Assume `sales` is a field in Product
    }

    // Check if recommendations were found
    if (recommendations.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No recommendations found" });
    }

    // Send back the recommendations
    res.status(200).json({
      success: true,
      message: "Recommendations generated",
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
