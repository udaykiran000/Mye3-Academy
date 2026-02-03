// frontend/src/components/student/SidebarLink.jsx
import React from 'react';

const SidebarLink = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center w-full px-4 py-3 rounded-lg
      transition-all duration-200 ease-in-out gap-3
      ${isActive 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-l-4 border-blue-400"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
      }
    `}
  >
    <span className={`${isActive ? "text-white" : "text-gray-400"}`}>
      {icon}
    </span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export default SidebarLink;
