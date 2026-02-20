import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
    
    const category = new Category({
      name: "SSC",
      slug: "ssc",
      description: "Staff Selection Commission Exams",
      image: "/uploads/images/ssc.png"
    });
    
    await category.save();
    console.log("✅ Seeded 'SSC' category successfully");
    
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
        console.log("⚠️ Category already exists");
        process.exit(0);
    }
    console.error("❌ Error seeding:", error);
    process.exit(1);
  }
};

connectDB();
