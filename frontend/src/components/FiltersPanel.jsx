import React from "react";

const FiltersPanel = ({
  categories = [],
  loading = false,
  selectedCategory = "",
  onSelectCategory,
}) => {
  return (
    <div className="bg-white">
      {loading && (
        <p className="text-slate-400 text-sm p-4">Loading categories...</p>
      )}

      {!loading && (
        <ul className="space-y-1">
          {/* ALL BUTTON */}
          <li>
            <button
              onClick={() => onSelectCategory("")}
              className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-all rounded-md ${
                selectedCategory === ""
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              All Categories
            </button>
          </li>

          {/* CATEGORY LIST */}
          {categories.map((cat) => (
            <li key={cat._id}>
              <button
                onClick={() => onSelectCategory(cat._id)}
                className={`block w-full text-left px-4 py-2.5 text-sm font-medium transition-all rounded-md ${
                  selectedCategory === cat._id
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}

          {categories.length === 0 && !loading && (
            <li className="text-slate-400 text-xs p-4 italic">
              No categories available
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FiltersPanel;
