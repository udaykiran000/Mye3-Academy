import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
    
    const categories = await Category.find({});
    console.log("--- EXISTING CATEGORIES ---");
    categories.forEach(c => console.log(`Name: ${c.name}, Slug: ${c.slug}, ID: ${c._id}`));
    console.log("---------------------------");
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

connectDB();
