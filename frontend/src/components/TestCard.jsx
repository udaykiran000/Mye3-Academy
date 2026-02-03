// src/components/TestCard.jsx
import React from "react";

const TestCard = ({ test }) => (
  <div className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
    <div className={`h-40 w-full flex items-center justify-center text-white text-xl font-bold ${
      test.type === "Grand"
        ? "bg-gradient-to-r from-purple-500 to-indigo-600"
        : "bg-gradient-to-r from-blue-500 to-cyan-500"
    }`}>
      {test.type === "Grand" ? "All-India Grand Test" : "Mock Test"}
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full mb-2">
        {test.category}
      </span>
      <h3 className="text-lg font-bold text-gray-800 mb-2 flex-grow">
        {test.title}
      </h3>
      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>{test.questions} Questions</span>
        <span>{test.duration} Minutes</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600">₹{test.price}</span>
        <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700">
          Buy Now
        </button>
      </div>
    </div>
  </div>
);

export default TestCard;
