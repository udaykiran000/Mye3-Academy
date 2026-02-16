import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MockTest from './models/MockTest.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
    
    // The ID captured from the user's screenshot URL
    // http://localhost:5173/student/instructions/69931f1a9860479cec0ef983
    // Wait, standard Mongo ObjectIds are 24 hex chars. 
    // 69931f1a9860479cec0ef983 is 24 chars (69931f1a9860479cec0ef983).
    // Let's check it.
    
    const id = "69931f1a9860479cec0ef983"; // From screenshot URL
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("❌ Invalid ObjectId format:", id);
        // List all to see what we have
        const all = await MockTest.find({}, '_id title');
        console.log("Available Tests:", all);
        process.exit(0);
    }

    const test = await MockTest.findById(id);
    if (test) {
        console.log("✅ Found Test:", test.title);
        console.log("Published:", test.isPublished);
    } else {
        console.log("❌ Test NOT found with ID:", id);
        const all = await MockTest.find({}, '_id title');
        console.log("Available Tests:", all);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

connectDB();
