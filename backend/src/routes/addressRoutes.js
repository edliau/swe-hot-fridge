const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { protect, authorize } = require("../middleware/authMiddleware"); // import your middleware

// Create a new address (protected, only authenticated users can create an address)
router.post("/addresses", protect, addressController.createAddress);

// Update an existing address (protected, only authenticated users can update their own addresses)
router.put("/addresses/:id", protect, addressController.updateAddress);

// Delete an address (protected, only authenticated users can delete their own addresses)
router.delete("/addresses/:id", protect, addressController.deleteAddress);

// Get a specific address by ID (protected, only authenticated users can get an address)
router.get("/addresses/:id", protect, addressController.getAddress);

// Get all addresses for a specific user (protected, only authenticated users can get their own addresses)
router.get(
  "/users/:userId/addresses",
  protect,
  addressController.getAddressesByUser
);

// Set an address as default (protected, only authenticated users can set their address as default)
router.put(
  "/addresses/:id/default",
  protect,
  addressController.setDefaultAddress
);

module.exports = router;
