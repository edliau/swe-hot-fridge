const Address = require("../models/Address");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const {
      userId,
      streetAddress,
      apartment,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
      deliveryInstructions,
    } = req.body;

    // Validate that required fields are present
    if (
      !userId ||
      !streetAddress ||
      !city ||
      !state ||
      !postalCode ||
      !country ||
      !phoneNumber
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide all required fields.",
        });
    }

    const newAddress = new Address({
      userId,
      streetAddress,
      apartment,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
      deliveryInstructions,
    });

    await newAddress.save();

    res
      .status(201)
      .json({ success: true, message: "Address created", data: newAddress });
  } catch (error) {
    console.error("Error creating address:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      streetAddress,
      apartment,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
      isDefault,
      deliveryInstructions,
    } = req.body;

    const address = await Address.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // Update fields
    address.streetAddress = streetAddress || address.streetAddress;
    address.apartment = apartment || address.apartment;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.phoneNumber = phoneNumber || address.phoneNumber;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
    address.deliveryInstructions =
      deliveryInstructions || address.deliveryInstructions;

    // Save updated address
    address.updatedAt = Date.now();
    await address.save();

    res
      .status(200)
      .json({ success: true, message: "Address updated", data: address });
  } catch (error) {
    console.error("Error updating address:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByIdAndDelete(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get a specific address by ID
exports.getAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    console.error("Error fetching address:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all addresses for a specific user
exports.getAddressesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await Address.find({ userId });
    if (!addresses || addresses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No addresses found for this user" });
    }

    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error("Error fetching addresses for user:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Set an address as default
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the current default address
    const currentDefault = await Address.findOne({
      userId: req.body.userId,
      isDefault: true,
    });
    if (currentDefault) {
      // If there is already a default, set it to false
      currentDefault.isDefault = false;
      await currentDefault.save();
    }

    // Find the address and set it as default
    const address = await Address.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    address.isDefault = true;
    await address.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Default address updated",
        data: address,
      });
  } catch (error) {
    console.error("Error setting default address:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
