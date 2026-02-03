import Razorpay from "razorpay";
import crypto from "crypto";
import Usermodel from "../models/Usermodel.js";
import Order from "../models/Order.js";
import PaymentGateway from "../models/PaymentGateway.js"; // Import the model
import mongoose from "mongoose";

// Helper: Get Razorpay Instance dynamically
const getRazorpayInstance = async () => {
  const settings = await PaymentGateway.findOne({ name: "Razorpay" });
  if (!settings || !settings.isActive) {
    throw new Error("Razorpay is currently disabled or not configured.");
  }
  return {
    instance: new Razorpay({
      key_id: settings.credentials.keyId,
      key_secret: settings.credentials.keySecret,
    }),
    secret: settings.credentials.keySecret
  };
};

// -------------------------------------------------------------
// CREATE ORDER (Dynamic)
// -------------------------------------------------------------
export const createOrder = async (req, res) => {
  try {
    const { amount, cartItems } = req.body;
    const userId = req.user.id;

    // 1. Get Dynamic Razorpay Instance
    const { instance } = await getRazorpayInstance();

    const options = {
      amount: amount, 
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        cartItems: JSON.stringify(cartItems.map((item) => item._id)),
      },
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Error creating Razorpay order");

    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).send(error.message || "Payment Gateway Error");
  }
};

// -------------------------------------------------------------
// VERIFY PAYMENT (Dynamic)
// -------------------------------------------------------------
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems, amount } = req.body;
    const userId = req.user.id;

    // 1. Get Dynamic Secret for Verification
    const { secret } = await getRazorpayInstance();

    // 2. Verify signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 3. Ensure user exists
    const user = await Usermodel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 4. Convert IDs
    const mockTestObjectIds = cartItems.map((id) => new mongoose.Types.ObjectId(id));

    // 5. Create order record
    const newOrder = new Order({
      user: userId,
      items: mockTestObjectIds,
      amount: amount / 100, 
      razorpay: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
      },
      status: "successful",
    });

    await newOrder.save();

    // 6. Add purchased mocktests
    await Usermodel.findByIdAndUpdate(userId, {
      $addToSet: { purchasedTests: { $each: mockTestObjectIds } },
      $set: { cart: [] },
    });

    const updatedUser = await Usermodel.findById(userId).populate("purchasedTests");

    res.json({
      success: true,
      message: "Payment successful",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Verification Error" });
  }
};

// -------------------------------------------------------------
// GET PAYMENT HISTORY (ADMIN) - Keeps existing logic
// -------------------------------------------------------------
export const getPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'items', select: 'title' })
      .sort({ createdAt: -1 });

    const formattedPayments = orders.map(order => ({
        _id: order._id,
        studentName: order.user ? order.user.name : 'User Deleted', 
        email: order.user ? order.user.email : 'N/A',
        courseName: order.items.length > 0 ? order.items.map(item => item.title).join(', ') : 'N/A',
        amount: order.amount,
        date: order.createdAt,
        orderId: order.razorpay?.order_id || 'N/A',
        paymentId: order.razorpay?.payment_id || 'N/A',
        status: order.status === "successful" ? "success" : order.status,
        method: 'Razorpay' 
    }));

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ success: false, message: "History Fetch Error" });
  }
};