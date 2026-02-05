import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, deleteCategory } from "../../../redux/categorySlice";
import { useNavigate, Link } from "react-router-dom";
import AddCategory from "./AddCategory";
import EditCategoryModal from "./EditCategoryModal";
import {
  Layout,
  Plus,
  Search,
  Trash2,
  Edit,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  let cleaned = imagePath.trim();
  if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
  return `http://localhost:8000${cleaned}`;
};

const SelectCategoryForCreation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories, loading } = useSelector((state) => state.category);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [categories, searchTerm]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this entry?")) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        toast.success("Removed");
      } catch (err) {
        toast.error("Failed");
      }
    }
  };

  const handleEdit = (e, cat) => {
    e.stopPropagation();
    setEditingCategory(cat);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Syncing Management...
        </p>
      </div>
    );

  return (
    <div className="bg-[#fafbfc] min-h-screen px-6 py-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. COMPACT HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="space-y-0.5">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-600 mb-1 transition uppercase tracking-tighter"
            >
              <ArrowLeft size={12} /> Dashboard Root
            </Link>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Exams Directory
            </h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-bold transition shadow-sm ${
              showAddForm
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {showAddForm ? "Cancel Operation" : "+ New Entry"}
          </button>
        </div>

        {/* 2. COMPACT SEARCH CONTROL */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-1">
          <div className="relative w-full md:max-w-xs group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Filter by label..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-300 outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-widest">
            Total Segments: {categories.length}
          </div>
        </div>

        {/* MODAL WRAPPER FOR ADDCATEGORY */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-[2px] bg-slate-900/40 animate-in fade-in duration-300">
            <div
              className="absolute inset-0 -z-10"
              onClick={() => setShowAddForm(false)}
            />
            <AddCategory onClose={() => setShowAddForm(false)} />
          </div>
        )}

        {/* 4. HIGH-DENSITY DIRECTORY GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredCategories.map((cat) => {
            const thumbUrl = getImageUrl(cat.image);
            return (
              <div
                key={cat._id}
                onClick={() => navigate(`/admin/mocktests/${cat.slug}`)}
                className="group relative bg-white border border-slate-200 rounded-md overflow-hidden cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all"
              >
                {/* SMALL ACTIONS BUTTONS (Hover Visible) */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEdit(e, cat)}
                    className="p-1 bg-white border border-slate-100 rounded hover:text-indigo-600 text-slate-400"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, cat._id)}
                    className="p-1 bg-white border border-slate-100 rounded hover:text-rose-600 text-slate-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* THUMBNAIL AREA (Clean Frame) */}
                <div className="h-28 w-full bg-[#fbfcfd] flex items-center justify-center p-4">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={cat.name}
                      className="w-full h-full object-contain grayscale-[0.3] group-hover:grayscale-0 transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-slate-200">
                      <Layout size={24} strokeWidth={1} />
                    </div>
                  )}
                </div>

                {/* COMPACT LABEL AREA */}
                <div className="px-3 py-2 border-t border-slate-100">
                  <h3 className="font-bold text-slate-700 text-[13px] truncate tracking-tight uppercase group-hover:text-indigo-600">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                      Active Index
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* NEW CARD IN GRID LOOK (Ghost Card) */}
          <div
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-slate-100 rounded-md h-[166px] flex flex-col items-center justify-center gap-2 hover:bg-indigo-50/50 hover:border-indigo-200 cursor-pointer text-slate-300 transition-colors"
          >
            <Plus size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Append
            </span>
          </div>
        </div>

        {/* EMPTY LIST STATE */}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-300 text-sm italic font-medium">
              Directory entries match failed or list empty.
            </p>
          </div>
        )}
      </div>

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
};

export default SelectCategoryForCreation;
