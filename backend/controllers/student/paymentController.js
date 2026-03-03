import Razorpay from "razorpay";
import crypto from "crypto";
import MockTest from "../../models/MockTest.js";
import GrandTest from "../../models/GrandTest.js";
import User from "../../models/Usermodel.js";
import Order from "../../models/Order.js";
import PaymentGateway from "../../models/PaymentGateway.js";

/**
 * Helper to find a test across both collections
 */
const findTestById = async (id) => {
  let test = await MockTest.findById(id);
  if (!test) test = await GrandTest.findById(id);
  return test;
};

/**
 * @desc    Get active payment gateway configuration (Key ID, Currency)
 * @route   GET /api/payment/config
 */
export const getPaymentConfig = async (req, res) => {
  try {
    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    
    if (!activeGateway) {
      return res.status(404).json({ success: false, message: "No active payment gateway" });
    }

    res.status(200).json({
      success: true,
       // Model hook decrypts keySecret, but we ONLY send keyId
      keyId: activeGateway.credentials.keyId,
      currency: activeGateway.currency,
      provider: activeGateway.name
    });
  } catch (error) {
    console.error("Config Error:", error);
    res.status(500).json({ success: false, message: "Failed to load payment config" });
  }
};

/**
 * @desc    Create a payment gateway order (Calculates amount on backend)
 * @route   POST /api/payment/create-order
 */
export const createOrder = async (req, res) => {
  try {
    const { cartItems: itemIds } = req.body; 
    const userId = req.user._id;

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: "No items in cart" });
    }

    // 1. Fetch active gateway
    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    if (!activeGateway) {
      return res.status(400).json({ success: false, message: "Payment service unavailable" });
    }

    // 2. Calculate Total Amount from DB (Security)
    // We must search both collections for each itemId
    const tests = await Promise.all(itemIds.map(id => findTestById(id)));
    
    if (tests.some(t => !t)) {
      return res.status(400).json({ success: false, message: "Some items not found in registry" });
    }

    let totalAmount = 0;
    tests.forEach(test => {
      // Use discountPrice if available, else price
      const priceToCharge = (test.discountPrice > 0 && test.discountPrice < test.price) 
        ? test.discountPrice 
        : test.price;
      totalAmount += Number(priceToCharge) || 0;
    });

    // 3. Initialize Razorpay or Mock
    let orderId;
    
    // Fallback logic: if keyId is "test", name is "Mock", or isTestMode is true, use mock branch
    const isMock = activeGateway.credentials.keyId === "test" || 
                   activeGateway.name === "Mock" || 
                   activeGateway.isTestMode === true ||
                   !activeGateway.credentials.keyId;

    if (isMock) {
        orderId = `mock_order_${Date.now()}`;
    } else {
        const instance = new Razorpay({
            key_id: activeGateway.credentials.keyId,
            key_secret: activeGateway.credentials.keySecret,
        });

        const options = {
            amount: Math.round(totalAmount * 100), // Amount in paise
            currency: activeGateway.currency || "INR",
            receipt: `receipt_${Date.now()}_${userId}`,
        };

        const order = await instance.orders.create(options);
        if (!order) {
            return res.status(500).json({ success: false, message: "Gateway order creation failed" });
        }
        orderId = order.id;
    }

    // 5. Save Order to Database
    const newOrder = new Order({
      user: userId,
      items: itemIds,
      amount: totalAmount,
      "razorpay.order_id": orderId,
      status: "created",
    });

    console.log(`[PAYMENT] Creating order for user ${userId} with items:`, itemIds);
    await newOrder.save();

    console.log(`✅ Order Created in DB: ${orderId}`);

    res.status(200).json({
      success: true,
      id: orderId, // Changed from orderId to id to be consistent with common use
      orderId: orderId, // Keeping both for safety during migration
      amount: Math.round(totalAmount * 100),
      currency: activeGateway.currency || "INR",
      keyId: activeGateway.credentials.keyId
    });

  } catch (error) {
    console.error("❌ CREATE_ORDER_CRITICAL_FAILURE:");
    console.error("Error Message:", error.message);
    console.error("Stack:", error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: "Order creation failed", 
      error: error.message 
    });
  }
};

/**
 * @desc    Verify payment signature and enroll user
 * @route   POST /api/payment/verify-payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    if (!activeGateway) {
       return res.status(500).json({ success: false, message: "Payment setup invalid" });
    }

    let isAuthentic = false;

    if (activeGateway.credentials.keyId === "test" || activeGateway.name === "Mock" || activeGateway.isTestMode === true) {
       if (razorpay_order_id.startsWith("mock_order_")) {
           isAuthentic = true;
       }
    } else {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", activeGateway.credentials.keySecret)
          .update(body.toString())
          .digest("hex");

        isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      const order = await Order.findOne({ "razorpay.order_id": razorpay_order_id });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      order.razorpay.payment_id = razorpay_payment_id;
      order.razorpay.signature = razorpay_signature;
      order.status = "successful";
      await order.save();

      // 3. Update User: Add to purchased tests AND clear cart
      const updatedUser = await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedTests: { $each: order.items } },
        $set: { cart: [] } // 🛒 Clear backend cart after purchase
      }, { new: true });

      res.status(200).json({ 
          success: true, 
          message: "Payment verified successfully",
          user: updatedUser 
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: "Verification failed", error: error.message });
  }
};

/**
 * @desc    Directly enroll student in free tests
 * @route   POST /api/payment/enroll-free
 */
export const enrollFree = async (req, res) => {
  try {
    const { cartItems } = req.body; 
    const userId = req.user._id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    // Verify items are free across both collections
    const tests = await Promise.all(cartItems.map(id => findTestById(id)));
    const freeTestIds = tests
      .filter(t => t && (t.isFree || Number(t.price) <= 0))
      .map(t => t._id.toString());

    if (freeTestIds.length === 0) {
      return res.status(400).json({ success: false, message: "No free tests found in request" });
    }

    // 🛒 Update User: Add to purchased tests AND clear cart
    const updatedUser = await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedTests: { $each: freeTestIds } },
      $set: { cart: [] } // Clear backend cart
    }, { new: true });

    res.status(200).json({ 
      success: true, 
      message: "Free tests enrolled successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error("Enroll Free Error:", error);
    res.status(500).json({ success: false, message: "Enrollment failed", error: error.message });
  }
};