// frontend/src/components/admin/CategorySalesChart.jsx

import React from "react";
import { FaBookmark } from "react-icons/fa";

const CategorySalesChart = ({ data }) => {
  // Use the data from the props, which now receives the array from Redux
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg h-64 flex items-center justify-center text-gray-500">
        No category sales data yet.
      </div>
    );
  }

  // Find max sales to create a relative bar width
  const maxSales = Math.max(...data.map((item) => item.salesCount), 0);
  
  return (
    <div className="p-2">
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-600 capitalize flex items-center">
                <FaBookmark className="w-3 h-3 text-blue-500 mr-2" />
                {item.category}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {item.salesCount} Sales
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full shadow-md"
                style={{
                  width: `${maxSales > 0 ? (item.salesCount / maxSales) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySalesChart;