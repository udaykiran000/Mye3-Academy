import User from "../models/Usermodel.js";
import MockTest from "../models/MockTest.js";

// Helper: ensure each cart item has imageUrl (fallback to thumbnail)
const normalizeCartItems = (cartArr) => {
  // cartArr: array of MockTest documents (populated)
  // convert to plain objects and ensure imageUrl exists
  return cartArr.map((doc) => {
    const obj = (doc && doc.toObject) ? doc.toObject() : doc;
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
    const user = await User.findById(req.user.id).populate({
      path: 'cart',
      model: 'MockTest',
      select: 'title price discountPrice thumbnail imageUrl categorySlug' // include thumbnail
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const normalized = normalizeCartItems(user.cart || []);
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

    // Check test exists
    const test = await MockTest.findById(mockTestId).select('title price discountPrice thumbnail imageUrl categorySlug');
    if (!test) {
      return res.status(404).json({ message: "Mock test not found" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { cart: mockTestId } },   
      { new: true }
    ).populate({
      path: 'cart',
      model: 'MockTest',
      select: 'title price discountPrice thumbnail imageUrl categorySlug'
    });

    const normalized = normalizeCartItems(user.cart || []);
    // Return both the new item and the updated cart (frontend expects newItem)
    return res.json({
      message: "Added to cart",
      newItem: (test && test.toObject) ? (() => { const o = test.toObject(); if(!o.imageUrl && o.thumbnail) o.imageUrl = o.thumbnail; return o; })() : test,
      cart: normalized
    });

  } catch (error) {
    console.error("ADD_TO_CART_ERROR:", error);
    return res.status(500).json({ message: "Server error while adding to cart.", error: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:mocktestId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { mocktestId } = req.params;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { cart: mocktestId } }, // $pull removes the item
      { new: true }
    ).populate({
      path: 'cart',
      model: 'MockTest',
      select: 'title price discountPrice thumbnail imageUrl categorySlug'
    });

    const normalized = normalizeCartItems(user.cart || []);
    return res.json(normalized);
  } catch (error) {
    console.error("REMOVE_FROM_CART_ERROR:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
