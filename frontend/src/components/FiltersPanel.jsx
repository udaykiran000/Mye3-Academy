import React from "react";

const FiltersPanel = ({
  categories = [],
  loading = false,
  selectedCategory = "",
  onSelectCategory,
}) => {
  return (
    <div className="p-5 border border-gray-700 rounded-lg shadow bg-gray-900 text-white">
      <h4 className="font-bold text-lg mb-4">Categories</h4>

      {loading && <p className="text-gray-400">Loading...</p>}

      {!loading && (
        <ul className="space-y-2">
          {/* ALL BUTTON */}
          <li>
            <button
              onClick={() => onSelectCategory("")}
              className={`block w-full text-left px-3 py-2 rounded transition ${
                selectedCategory === ""
                  ? "bg-cyan-600 text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              All
            </button>
          </li>

          {/* CATEGORY LIST */}
          {categories.map((cat) => (
            <li key={cat._id}>
              <button
                onClick={() => onSelectCategory(cat._id)}
                className={`block w-full text-left px-3 py-2 rounded transition ${
                  selectedCategory === cat._id
                    ? "bg-cyan-600 text-white"
                    : "hover:bg-gray-800"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}

          {categories.length === 0 && (
            <li className="text-gray-400">No categories found.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FiltersPanel;
