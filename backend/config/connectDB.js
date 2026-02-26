import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, { family: 4 });
    console.log("MongoDB connected successfully");
  } 
  catch (error) {
    console.log("Error in DB connection", error);
    process.exit(1);
  }
};
export default connectDB;             