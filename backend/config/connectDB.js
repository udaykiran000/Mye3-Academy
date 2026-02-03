import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected sucess fully");
  } 
  catch (error) {
    console.log("Error in DB connection", error);
  }
};
export default connectDB;             