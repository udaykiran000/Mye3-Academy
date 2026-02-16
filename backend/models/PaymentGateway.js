import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/encryption.js";

const paymentGatewaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // "Razorpay", "Stripe", "Paypal"
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      default: "INR",
    },
    // We group keys so we can add more later without changing schema
    credentials: {
      keyId: { type: String, default: "" },      // Public Key / Client ID
      keySecret: { type: String, default: "" },  // Secret Key
    },
    isTestMode: {
      type: Boolean,
      default: true,
    },
    themeColor: {
      type: String,
      default: "#3399cc",
    },
  },
  { timestamps: true }
);

// Encrypt secret key before saving
paymentGatewaySchema.pre('save', function(next) {
  if (this.isModified('credentials.keySecret') && this.credentials.keySecret) {
    this.credentials.keySecret = encrypt(this.credentials.keySecret);
  }
  next();
});

// Decrypt secret key after retrieving
paymentGatewaySchema.post('init', function(doc) {
  if (doc.credentials && doc.credentials.keySecret) {
    doc.credentials.keySecret = decrypt(doc.credentials.keySecret);
  }
});

const PaymentGateway = mongoose.model("PaymentGateway", paymentGatewaySchema);

export default PaymentGateway;