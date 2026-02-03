// frontend/src/components/admin/StatCard.jsx

import React from 'react';
import { FaArrowUp } from 'react-icons/fa'; // Used for potential upward trend visualization

const StatCard = ({ title, value, icon, bgColor, iconColor }) => {
  // Enhanced card styling for a futuristic/impressive look
  const cardClasses = `
    ${bgColor} 
    text-white 
    rounded-2xl 
    p-6 
    shadow-2xl 
    transform 
    transition-all 
    duration-300 
    hover:scale-[1.03] 
    hover:shadow-indigo-500/50 
    relative 
    overflow-hidden
  `;

  // Placeholder for a subtle background effect
  const bgEffect = (
    <div 
        className={`absolute inset-0 opacity-10 ${bgColor.replace(/from-/, 'from-transparent').replace(/to-/, 'to-')}`}
    >
        {/* Subtle radial or diagonal effect could go here */}
    </div>
  );

  return (
    <div className={cardClasses}>
        {bgEffect}
        
        {/* Icon (Large, positioned subtly) */}
        <div 
            className={`absolute top-4 right-4 text-6xl opacity-20 ${iconColor}`}
            style={{ transform: 'rotate(-15deg)' }}
        >
            {icon}
        </div>

        {/* Value (Main Focus) */}
        <div className="text-4xl font-extrabold mb-1 tracking-tight relative z-10">
            {value}
        </div>

        {/* Title */}
        <p className="text-sm font-light uppercase tracking-wider opacity-90 relative z-10">
            {title}
        </p>

        {/* Small Detail/Trend Indicator */}
        <div className="flex items-center text-xs mt-3 opacity-80 relative z-10">
            <FaArrowUp className="w-3 h-3 mr-1" />
            <span className="font-semibold">2.5%</span> 
            <span className='ml-1'> since last week</span> 
            {/* Note: In a real app, '2.5%' would come from dynamic comparison data. */}
        </div>
    </div>
  );
};

export default StatCard;