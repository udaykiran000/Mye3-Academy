import Category from "../models/Category.js";
import slugify from "slugify";
import fs from "fs";

// ----------------------------------------------------------------------
// 1. Create Category (POST)
// ----------------------------------------------------------------------
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Handle image path if uploaded
    const image = req.file ? req.file.path.replace(/\\/g, "/") : null;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check duplicates
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Create new category
    const category = await new Category({
      name,
      slug: slugify(name, { lower: true }),
      description,
      image,
    }).save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while creating category",
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// 2. Get All Categories (GET)
// ----------------------------------------------------------------------
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

// ----------------------------------------------------------------------
// 3. Update Category (PUT)
// ----------------------------------------------------------------------
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = slugify(name, { lower: true });
    }
    if (description) category.description = description;

    if (req.file) {
      // Delete old image if it exists locally
      if (category.image && fs.existsSync(category.image)) {
        try {
          fs.unlinkSync(category.image);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
      category.image = req.file.path.replace(/\\/g, "/");
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while updating category",
      error: error.message,
    });
  }
};

// ----------------------------------------------------------------------
// 4. Delete Category (DELETE)
// ----------------------------------------------------------------------
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.image && fs.existsSync(category.image)) {
      try {
        fs.unlinkSync(category.image);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while deleting category",
      error: error.message,
    });
  }
};