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

export const downloadPaymentReport = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "firstname lastname email")
      .populate("items", "title")
      .sort({ createdAt: -1 });

    const data = orders.map((order) => {
      const courseNames = order.items.map((item) => item.title).join("; ");
      return {
        "Order ID": order.razorpay?.order_id || "N/A",
        "Payment ID": order.razorpay?.payment_id || "N/A",
        Student: order.user ? `${order.user.firstname} ${order.user.lastname}` : "Unknown",
        Email: order.user?.email || "N/A",
        Tests: courseNames || "Deleted",
        Amount: order.amount,
        Date: new Date(order.createdAt).toLocaleDateString(),
        Status: order.status,
      };
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "No payments found to export" });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = headers.map((header) => `"${row[header]}"`);
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Payments_Report.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
};
