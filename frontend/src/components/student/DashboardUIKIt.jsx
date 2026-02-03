import React from 'react';

export const StatCard = ({ icon, title, value, color }) => (
  <div
    className={`bg-white p-6 rounded-lg shadow-lg border-l-4 border-${color}-500`}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-semibold text-gray-800 mb-6">{title}</h3>
    {children}
  </div>
);

export const Th = ({ children }) => (
  <th
    scope="col"
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
  >
    {children}
  </th>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${className}`}>
    {children}
  </td>
);