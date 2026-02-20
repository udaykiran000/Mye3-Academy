import Razorpay from "razorpay";
import crypto from "crypto";
import MockTest from "../../models/MockTest.js";
import User from "../../models/Usermodel.js";
import Order from "../../models/Order.js";
import PaymentGateway from "../../models/PaymentGateway.js";

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
    const { cartItems: itemIds } = req.body; // Expecting array of MockTest IDs
    const userId = req.user._id;

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: "No items in cart" });
    }

    // 1. Fetch active gateway
    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    console.log("DEBUG: createOrder - Active Gateway:", activeGateway ? activeGateway.name : "None");
    if (activeGateway) {
        console.log("DEBUG: Full Gateway Object:", JSON.stringify(activeGateway, null, 2));
    }
    
    if (!activeGateway) {
      console.error("DEBUG: createOrder - No active gateway found");
      return res.status(400).json({ success: false, message: "Payment service unavailable" });
    }

    // 2. Calculate Total Amount from DB (Security)
    const mockTests = await MockTest.find({ _id: { $in: itemIds } });
    if (mockTests.length !== itemIds.length) {
      return res.status(400).json({ success: false, message: "Some items not found" });
    }

    let totalAmount = 0;
    mockTests.forEach(test => {
      totalAmount += test.price;
    });

    // 3. Initialize Razorpay or Mock
    let orderId;
    
    // MOCK MODE CHECK
    if (activeGateway.credentials.keyId === "test") {
        console.log("DEBUG: MOCK MODE ENABLED");
        orderId = `mock_order_${Date.now()}`;
    } else {
        // REAL RAZORPAY
        const instance = new Razorpay({
            key_id: activeGateway.credentials.keyId,
            key_secret: activeGateway.credentials.keySecret,
        });

        const options = {
            amount: totalAmount * 100, // Amount in paise
            currency: activeGateway.currency,
            receipt: `receipt_${Date.now()}_${userId}`,
        };

        // 4. Create Order on Razorpay
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

    await newOrder.save();

    res.status(200).json({
      success: true,
      orderId: orderId,
      amount: totalAmount * 100,
      currency: activeGateway.currency,
      keyId: activeGateway.credentials.keyId
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: "Order creation failed", error: error.message });
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

    // 1. Fetch active gateway for secret
    const activeGateway = await PaymentGateway.findOne({ isActive: true });
    if (!activeGateway) {
       return res.status(500).json({ success: false, message: "Payment setup invalid" });
    }

    // 2. Verify Signature
    let isAuthentic = false;

    if (activeGateway.credentials.keyId === "test") {
       console.log("DEBUG: MOCK MODE VERIFICATION");
       // In mock mode, we trust the client's "success" signal if order ID matches our mock pattern
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
      // 3. Fulfill Order
      // Find the order by Razorpay Order ID
      const order = await Order.findOne({ "razorpay.order_id": razorpay_order_id });

      if (!order) {
         return res.status(404).json({ success: false, message: "Order not found" });
      }

      // Update Order Status
      order.razorpay.payment_id = razorpay_payment_id;
      order.razorpay.signature = razorpay_signature;
      order.status = "successful";
      await order.save();

      // Enroll User (Add items to purchasedTests)
      const updatedUser = await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedTests: { $each: order.items } }
      }, { new: true })
      .populate({
          path: "purchasedTests",
          populate: { path: "category", select: "name slug" }
      });

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
    const { cartItems } = req.body; // Expecting array of IDs
    const userId = req.user._id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    // 🔒 SECURITY: Verify items are actually free
    const freeTests = await MockTest.find({
      _id: { $in: cartItems },
      isFree: true
    });

    if (freeTests.length === 0) {
      return res.status(400).json({ success: false, message: "No free tests found in request" });
    }

    const freeTestIds = freeTests.map(t => t._id.toString());
    const user = await User.findById(userId);

    freeTestIds.forEach(id => {
      if (!user.purchasedTests.includes(id)) {
        user.purchasedTests.push(id);
      }
    });

    await user.save();
    
    // Check if some items were skipped (paid items in free request)
    if (freeTests.length !== cartItems.length) {
       return res.status(200).json({ 
         success: true, 
         message: "Enrolled in free tests only. Paid items were skipped." 
       });
    }

    res.status(200).json({ success: true, message: "Free tests enrolled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Enrollment failed", error: error.message });
  }
};