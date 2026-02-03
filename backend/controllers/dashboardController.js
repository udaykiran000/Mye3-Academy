// backend/controllers/dashboardController.js

import User from "../models/Usermodel.js";
import MockTest from "../models/MockTest.js";
import Order from "../models/Order.js";
import Attempt from "../models/Attempt.js";

export const getAdminStats = async (req, res) => {
  try {
    // 1. Get user counts
    const studentCount = await User.countDocuments({ role: "student" });
    const instructorCount = await User.countDocuments({ role: "instructor" });

    // 2. Get content counts
    const mockTestCount = await MockTest.countDocuments();
    const totalAttempts = await Attempt.countDocuments();

    // 3. Get sales data (Revenue & Orders)
    const salesData = await Order.aggregate([
      { $match: { status: "successful" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 4. Get Category Sales Breakdown
    const categorySales = await Order.aggregate([
      { $match: { status: "successful" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "mocktests", // The collection name for MockTest model
          localField: "items",
          foreignField: "_id",
          as: "mockTestDetails",
        },
      },
      { $unwind: "$mockTestDetails" },
      {
        $group: {
          _id: "$mockTestDetails.categorySlug", 
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { salesCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          category: "$_id",
          salesCount: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Get Test Type Sales Breakdown
    const testTypeSales = await Order.aggregate([
      { $match: { status: "successful" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "mocktests",
          localField: "items",
          foreignField: "_id",
          as: "mockTestDetails",
        },
      },
      { $unwind: "$mockTestDetails" },
      {
        $group: {
          _id: "$mockTestDetails.isGrandTest",
          totalRevenue: { $sum: "$mockTestDetails.price" }, 
          salesCount: { $sum: 1 },
        },
      },
      {
        $project: {
          testType: {
            $cond: { if: "$_id", then: "Grand Tests", else: "Regular Tests" },
          },
          totalRevenue: 1,
          salesCount: 1,
          _id: 0,
        },
      },
    ]);

    // 6. FINAL STATS OBJECT (FIX: Include categorySales and testTypeSales)
    const stats = {
      students: studentCount,
      instructors: instructorCount,
      mockTests: mockTestCount,
      attempts: totalAttempts,
      revenue: salesData[0]?.totalRevenue || 0,
      orders: salesData[0]?.totalOrders || 0,
      categorySales: categorySales, // <-- FIX APPLIED
      testTypeSales: testTypeSales, // <-- FIX APPLIED
    };

    res.status(200).json({
      success: true,
      message: "Admin statistics fetched successfully",
      stats,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
      error: error.message,
    });
  }
};