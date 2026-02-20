import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MockTest from './models/MockTest.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
    
    const tests = await MockTest.find({});
    console.log("--- MOCK TESTS ---");
    tests.forEach(t => {
        console.log(`Title: ${t.title}`);
        console.log(`ID: ${t._id}`);
        console.log(`Published: ${t.isPublished}`);
        console.log(`Category: ${t.categorySlug}`);
        console.log("-------------------");
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

connectDB();
