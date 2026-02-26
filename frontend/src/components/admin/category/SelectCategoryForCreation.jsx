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
    <div className="bg-[#EDF0FF] min-h-screen font-poppins">
      {/* WHITE HEADER STRIP */}
      <div className="bg-white border-b border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 py-8 animate-in fade-in slide-in-from-top-1 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#7e7e7e] hover:text-[#21b731] transition-all uppercase tracking-[0.2em]"
              >
                <ArrowLeft size={12} /> Back
              </button>
              <div>
                <h1 className="text-2xl font-black text-[#3e4954] tracking-tight uppercase">
                  Exam Categories
                </h1>
                <p className="text-[11px] text-[#7e7e7e] font-black uppercase tracking-[0.1em] opacity-80 mt-1">Manage and organize your exam categories</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#21b731] transition-colors" size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-none pl-9 pr-4 py-2.5 text-xs focus:bg-white focus:border-[#21b731] focus:ring-4 focus:ring-[#21b731]/5 outline-none w-56 md:w-64 transition-all font-poppins text-[#3e4954] font-bold"
                  />
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#21b731] text-white px-6 py-2.5 rounded-none text-[11px] font-black uppercase tracking-[0.15em] hover:bg-[#1a9227] transition-all shadow-lg shadow-green-100 flex items-center gap-2 font-poppins hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={16} /> Add New
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-6 pb-12 space-y-8 animate-in fade-in transition-all duration-1000">
        
        {/* CATEGORY GRID - COMPACT & HIGH DENSITY */}

        {/* CATEGORY GRID - COMPACT & HIGH DENSITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredCategories.map((cat) => (
                <div
                    key={cat._id}
                    onClick={() => navigate(`/admin/mocktests/${cat.slug}`)}
                    className="group bg-white rounded-none border border-slate-100 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2 cursor-pointer relative"
                >
                    {/* Image Container - Visual Focused */}
                    <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                        <img 
                            src={getImageUrl(cat.image)} 
                            alt={cat.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Glassmorphic Actions Overlay */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                            <button 
                                onClick={(e) => handleEdit(e, cat)}
                                className="w-8 h-8 bg-white/90 backdrop-blur-md text-slate-600 hover:text-[#21b731] transition-all flex items-center justify-center shadow-lg"
                            >
                                <Edit size={14} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, cat._id)}
                                className="w-8 h-8 bg-white/90 backdrop-blur-md text-slate-600 hover:text-rose-500 transition-all flex items-center justify-center shadow-lg"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Category Label Overlay */}
                        <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em]">
                            {cat.slug}
                        </div>

                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-5 space-y-3 relative">
                        <div className="flex items-start justify-between">
                            <h3 className="text-[18px] font-black text-[#3e4954] tracking-tight group-hover:text-[#21b731] transition-colors line-clamp-1 leading-tight uppercase">
                                {cat.name}
                            </h3>
                            <div className="w-8 h-8 bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-[#21b731]/10 group-hover:text-[#21b731] transition-all">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <div className="h-[2px] w-6 bg-[#21b731] rounded-full" />
                             <span className="text-[10px] font-bold text-[#7e7e7e] uppercase tracking-widest font-poppins">Explore tests</span>
                        </div>
                    </div>

                    {/* Premium Shimmer Line */}
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100">
                      <div className="h-full bg-gradient-to-r from-[#21b731] to-emerald-400 w-0 group-hover:w-full transition-all duration-700 ease-in-out" />
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
