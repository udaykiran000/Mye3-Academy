import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Must match your User model name
      required: true,
    },

    // Items purchased in the order
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MockTest", // Must match your MockTest model name
      },
    ],

    amount: {
      type: Number,
      required: true,
    },

    // Razorpay payment details
    razorpay: {
      order_id: String,
      payment_id: String,
      signature: String,
    },

    status: {
      type: String,
      enum: ["created", "successful", "failed"],
      default: "created",
    },
    attemptUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
