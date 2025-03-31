const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["personalized", "trending", "similar", "best_seller"], // Define valid types
  },
  score: {
    type: Number,
    required: true,
    min: 0, // Ensure scores are non-negative
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set creation timestamp
  },
});

// Index for faster recommendations lookup
recommendationSchema.index({ userId: 1, score: -1 });

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

module.exports = Recommendation;
