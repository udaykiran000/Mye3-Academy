import User from "../../models/Usermodel.js";
import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";

/**
 * Helper: Find a test by ID in both collections
 */
const findTestById = async (id) => {
  let test = await MockTest.findById(id).select('title price discountPrice thumbnail imageUrl categorySlug');
  if (!test) {
    test = await GrandTest.findById(id).select('title price discountPrice thumbnail imageUrl categorySlug');
    if (test) {
      test = test.toObject();
      test.isGrandTest = true; // Flag for frontend
    }
  } else {
    test = test.toObject();
  }
  return test;
};

// Helper: ensure each cart item has imageUrl (fallback to thumbnail)
const normalizeCartItems = async (cartIds) => {
  if (!cartIds || cartIds.length === 0) return [];
  
  // Resolve each ID to a full object from its respective collection
  const items = await Promise.all(cartIds.map(id => findTestById(id)));
  
  return items.filter(Boolean).map((obj) => {
    // prefer existing imageUrl, otherwise use thumbnail if present
    if (!obj.imageUrl && obj.thumbnail) {
      obj.imageUrl = obj.thumbnail;
    }
    return obj;
  });
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cart');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalized = await normalizeCartItems(user.cart || []);
    return res.json(normalized);
  } catch (error) {
    console.error("GET_CART_ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { mockTestId } = req.body;  // frontend sends mockTestId
     
    if (!mockTestId) {
      return res.status(400).json({ message: "mockTestId is required." });
    }

    const userId = req.user.id;

    // Check test exists in either collection
    const test = await findTestById(mockTestId);
    if (!test) {
      return res.status(404).json({ message: "Mock test not found in registry" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { cart: mockTestId } },   
      { new: true }
    );

    const normalized = await normalizeCartItems(user.cart || []);
    
    // Return both the new item and the updated cart (frontend expects newItem)
    return res.json({
      message: "Added to cart",
      newItem: test,
      cart: normalized
    });

  } catch (error) {
    console.error("ADD_TO_CART_ERROR:", error);
    return res.status(500).json({ message: "Server error while adding to cart.", error: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:id
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    // Route uses :id, so use req.params.id
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
        return res.status(400).json({ success: false, message: "Item ID required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { cart: id } }, 
      { new: true }
    );

    const normalized = await normalizeCartItems(user.cart || []);
    return res.json(normalized);
  } catch (error) {
    console.error("REMOVE_FROM_CART_ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
