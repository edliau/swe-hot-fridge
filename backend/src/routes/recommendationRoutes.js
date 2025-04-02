const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const { protect, authorize } = require("../middleware/authMiddleware"); // import your middleware

// Route to generate recommendations
// This route expects the userId as a parameter and the recommendation type in the body
router.post(
  "/users/:userId/recommendations",
  protect,
  recommendationController.generateRecommendations
);

module.exports = router;
