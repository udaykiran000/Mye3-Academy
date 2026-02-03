import React from "react";
import { Search } from "lucide-react"; // Assuming lucide-react is used for icons

const SearchBar = ({ value, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="w-full max-w-xl mx-auto relative">
    <input
      type="text"
      placeholder="Search for tests, categories, or keywords..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-6 py-4 pr-16 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl shadow-2xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-300 placeholder-gray-400"
    />
    <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition duration-300">
      <Search className="w-5 h-5 text-gray-900" />
    </button>
  </form>
);

export default SearchBar;