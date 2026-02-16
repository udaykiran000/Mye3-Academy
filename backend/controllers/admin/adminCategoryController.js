import Category from "../../models/Category.js";
import slugify from "slugify"; // Make sure to: npm install slugify
import fs from "fs";
import path from "path";

/**
 * 1. Get All Categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories" });
  }
};

/**
 * 2. Add/Create Category
 * 
 */
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Logic: Save image path if Multer uploaded a file
    const image = req.file ? req.file.path.replace(/\\/g, "/") : null;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

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
    res
      .status(500)
      .json({
        success: false,
        message: "Error while creating category",
        error: error.message,
      });
  }
};

/**
 * 3. Update Category (With Image Cleanup)
 */
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

    //  If new image is uploaded, 
    if (req.file) {
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
    res
      .status(500)
      .json({ success: false, message: "Error while updating category" });
  }
};

/**
 * 4. Delete Category (With Image Cleanup)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    //  Cleanup image file from server
    if (category.image && fs.existsSync(category.image)) {
      try {
        fs.unlinkSync(category.image);
      } catch (err) {
        console.error("Failed to delete image file:", err);
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error while deleting category" });
  }
};
