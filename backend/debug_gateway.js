
import mongoose from "mongoose";
import dotenv from "dotenv";
import PaymentGateway from "./models/PaymentGateway.js";
import connectDB from "./config/connectDB.js";

dotenv.config();

const debugGateway = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    
    if (activeGateway) {
        console.log("Active Gateway Found:", activeGateway.name);
        console.log("Credentials:", JSON.stringify(activeGateway.credentials, null, 2));
        
        // Check if encryption/decryption is working
        // The model has a post-init hook to decrypt, so we should see plain text if it works
        console.log("Key ID present?", !!activeGateway.credentials.keyId);
        console.log("Key Secret present?", !!activeGateway.credentials.keySecret);
        
    } else {
        console.log("No active gateway found.");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
};

debugGateway();
