import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, deleteCategory } from "../../../redux/categorySlice";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  Layers,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { getImageUrl, handleImageError } from "../../../utils/imageHelper";

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
           Loading Exam Categories...
        </p>
      </div>
    );

  return (
    <div className="bg-[#f8f9fa] min-h-screen px-4 md:px-6 py-4">
      <div className="max-w-[1700px] mx-auto space-y-6 animate-in fade-in transition-all duration-1000">
        
        {/* REFINED HEADER - COMPACT */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[#7e7e7e] hover:text-[#21b731] transition-all uppercase tracking-widest"
            >
              <ArrowLeft size={12} /> Back
            </button>
            <div>
              <h1 className="text-xl font-black text-[#3e4954] tracking-tight font-poppins">
                Exam Categories
              </h1>
              <p className="text-[11px] text-[#7e7e7e] font-bold uppercase tracking-tight font-poppins opacity-80">Manage and organize your exam categories</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-none pl-9 pr-3 py-2 text-xs focus:border-[#21b731] outline-none shadow-sm w-48 transition-all font-poppins text-[#3e4954]"
                />
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[#21b731] text-white px-4 py-2 rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-[#1a9227] transition-all shadow-md shadow-green-100 flex items-center gap-2 font-poppins"
              >
                <Plus size={14} /> Add New
              </button>
          </div>
        </div>

        {/* CATEGORY GRID - COMPACT & HIGH DENSITY */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCategories.map((cat) => (
                <div
                    key={cat._id}
                    onClick={() => navigate(`/admin/mocktests/${cat.slug}`)}
                    className="group relative bg-white border border-slate-200 rounded-none cursor-pointer transition-all duration-500 hover:shadow-xl hover:border-[#21b731]/40 flex flex-col hover:-translate-y-1"
                >
                    {/* Floating pill badge */}
                    <div className="absolute top-2 left-2 z-20">
                        <span className="text-[7px] font-black text-[#7e7e7e] group-hover:text-white group-hover:bg-[#21b731] uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 transition-all duration-300 font-poppins shadow-sm">
                          Category
                        </span>
                    </div>

                    {/* Floating Actions - Partially visible by default */}
                    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 translate-x-0 transition-all duration-500">
                        <button 
                            onClick={(e) => handleEdit(e, cat)}
                            className="w-7 h-7 bg-white border border-slate-200 text-slate-400 hover:text-[#21b731] hover:border-[#21b731] transition-all flex items-center justify-center shadow-md rounded"
                            title="Edit"
                        >
                            <Edit size={12} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(e, cat._id)}
                            className="w-7 h-7 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all flex items-center justify-center shadow-md rounded"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>

                    {/* Image Container - Increased padding for smaller image */}
                    <div className="aspect-square bg-[#f8f9fa] flex items-center justify-center p-10 relative overflow-hidden">
                        <img 
                            src={getImageUrl(cat.image)} 
                            alt={cat.name}
                            className="w-full h-full object-contain relative z-10 transition-all duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#21b731]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-3 space-y-2 border-t border-slate-50 relative bg-white group-hover:bg-[#fcfdfd] transition-colors duration-500">
                        <h3 className="text-[14px] font-black text-[#3e4954] tracking-tight group-hover:text-[#21b731] transition-colors line-clamp-1 font-poppins leading-tight">
                            {cat.name}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 opacity-60">
                             <div className="h-[1.5px] w-4 bg-slate-200 group-hover:bg-[#21b731] transition-all duration-500 group-hover:w-8" />
                             <span className="text-[8px] font-bold text-[#7e7e7e] uppercase tracking-widest font-poppins">Open</span>
                        </div>
                    </div>

                    {/* Premium Accent Line */}
                    <div className="h-[2px] bg-slate-100 w-full overflow-hidden">
                      <div className="h-full bg-[#21b731] w-0 group-hover:w-full transition-all duration-700 ease-in-out shadow-[0_0_8px_#21b731]" />
                    </div>
                </div>
            ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed border-slate-100 rounded-none bg-white flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 mb-6 flex items-center justify-center">
                <Search size={24} />
             </div>
             <h3 className="text-[#3e4954] font-bold uppercase tracking-widest text-sm font-poppins">No Categories Found</h3>
             <p className="text-[#7e7e7e] font-medium text-xs mt-2 font-poppins uppercase tracking-tighter">Adjust your search or add a new category to get started</p>
          </div>
        )}
      </div>

      {/* MODALS - REFINED & SQUARE */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 transition-all duration-300">
            <div className="absolute inset-0" onClick={() => setShowAddForm(false)} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
                <AddCategory onClose={() => setShowAddForm(false)} />
            </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 transition-all duration-300">
           <div className="absolute inset-0" onClick={() => setEditingCategory(null)} />
           <div className="relative z-10 w-full max-w-lg bg-white rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
              <EditCategoryModal
                category={editingCategory}
                onClose={() => setEditingCategory(null)}
              />
           </div>
        </div>
      )}

    </div>
  );
};

export default SelectCategoryForCreation;
