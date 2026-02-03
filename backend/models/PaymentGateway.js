import mongoose from "mongoose";

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

const PaymentGateway = mongoose.model("PaymentGateway", paymentGatewaySchema);

export default PaymentGateway;