// frontend/src/components/admin/TestTypeBreakdown.jsx
// (Create this new file)

import React from "react";
import { FaTasks, FaTrophy } from "react-icons/fa";

// Helper to format currency
const formatRevenue = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

const TestTypeBreakdown = ({ data }) => {
  const regular = data.find(d => d.testType === "Regular Tests") || { salesCount: 0, totalRevenue: 0 };
  const grand = data.find(d => d.testType === "Grand Tests") || { salesCount: 0, totalRevenue: 0 };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">
        Sales by Test Type
      </h3>
      <div className="space-y-5">
        
        {/* Regular Tests Card */}
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <FaTasks size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Regular Tests</p>
            <p className="text-2xl font-bold text-gray-800">
              {regular.salesCount}
              <span className="text-base font-medium ml-2">Sales</span>
            </p>
            <p className="text-sm font-semibold text-green-700">
              {formatRevenue(regular.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Grand Tests Card */}
        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <FaTrophy size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Grand Tests</p>
            <p className="text-2xl font-bold text-gray-800">
              {grand.salesCount}
              <span className="text-base font-medium ml-2">Sales</span>
            </p>
            <p className="text-sm font-semibold text-yellow-700">
              {formatRevenue(grand.totalRevenue)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TestTypeBreakdown;