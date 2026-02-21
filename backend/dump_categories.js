import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    const categories = await Category.find({});
    console.log(JSON.stringify(categories, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB();
