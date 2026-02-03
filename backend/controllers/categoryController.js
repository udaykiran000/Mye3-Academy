// backend/controllers/categoryController.js
import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const cats = await Category.find().lean();
  res.json({ categories: cats });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

