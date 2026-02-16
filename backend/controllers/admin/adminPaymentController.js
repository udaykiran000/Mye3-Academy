import Order from "../../models/Order.js";

/**
 * @desc    Get all payment transactions
 * @route   GET /api/admin/payments
 */
export const getAllPayments = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "firstName lastName email")
      .populate("items", "title")
      .sort({ createdAt: -1 });

    // Transform to match frontend expectation
    const formattedPayments = orders.map((order) => {
      // Join all course titles if multiple
      const courseNames = order.items.map((item) => item.title).join(", ");
      
      return {
        _id: order._id,
        orderId: order.razorpay?.order_id || "N/A",
        paymentId: order.razorpay?.payment_id || "N/A",
        studentName: order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown User",
        email: order.user?.email || "N/A",
        courseName: courseNames || "Deleted Course",
        amount: order.amount,
        date: order.createdAt,
        status: order.status === "successful" ? "success" : order.status === "created" ? "pending" : "failed",
      };
    });

    res.status(200).json(formattedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};
