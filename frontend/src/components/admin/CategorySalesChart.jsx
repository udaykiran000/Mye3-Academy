// frontend/src/components/admin/CategorySalesChart.jsx

import React from "react";
import { Bookmark } from "lucide-react";

const CategorySalesChart = ({ data }) => {
  // Use the data from the props, which now receives the array from Redux
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-slate-50/50 rounded-none h-48 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
        <Bookmark size={24} className="mb-2 opacity-20" />
        <p className="text-sm font-medium">No category sales metrics</p>
      </div>
    );
  }

  // Find max sales to create a relative bar width
  const maxSales = Math.max(...data.map((item) => item.salesCount), 0);
  
  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-bold text-slate-600 capitalize flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#21b731]"></div>
              {item.category}
            </span>
            <span className="text-[13px] font-black text-slate-800">
              {item.salesCount} <span className="text-slate-400 font-medium">Units</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#21b731] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_4px_12px_rgba(33,183,49,0.2)]"
              style={{
                width: `${maxSales > 0 ? (item.salesCount / maxSales) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategorySalesChart;