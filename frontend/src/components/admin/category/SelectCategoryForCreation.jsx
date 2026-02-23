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
import { toast } from "react-hot-toast";

import { getImageUrl, handleImageError } from "../../../utils/imageHelper";

const SelectCategoryForCreation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories, loading } = useSelector((state) => state.category);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedType = searchParams.get("type"); // 'mock' or 'grand'

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
           Opening Exam Vault...
        </p>
      </div>
    );

  // --- VIEW 1: TYPE SELECTION ---
  if (!selectedType) {
    return (
      <div className="bg-[#f8fafc] min-h-screen px-6 py-16 flex flex-col items-center">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Exams Control Center</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">Select preferred test format to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* MOCK TEST CARD */}
            <div 
              onClick={() => setSearchParams({ type: 'mock' })}
              className="group relative bg-white border border-slate-200 rounded-3xl p-10 cursor-pointer hover:border-indigo-600 hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.2)] transition-all duration-500"
            >
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                  <Layers size={44} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Mock Tests</h2>
                  <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">Perfect for practice sessions, unit-wise assessments, and subject revisions.</p>
                </div>
                <div className="flex items-center gap-3 text-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] pt-4">
                  Explore Categories <ArrowRight size={16} className="group-hover:translate-x-3 transition-transform" />
                </div>
              </div>
            </div>

            {/* GRAND TEST CARD */}
            <div 
              onClick={() => setSearchParams({ type: 'grand' })}
              className="group relative bg-white border border-slate-200 rounded-3xl p-10 cursor-pointer hover:border-amber-500 hover:shadow-[0_30px_60px_-15px_rgba(245,158,11,0.2)] transition-all duration-500"
            >
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform duration-500">
                  <Trophy size={44} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Grand Tests</h2>
                  <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">Comprehensive, scheduled examinations with full-length syllabus coverage.</p>
                </div>
                <div className="flex items-center gap-3 text-amber-600 font-black text-[11px] uppercase tracking-[0.2em] pt-4">
                  Explore Categories <ArrowRight size={16} className="group-hover:translate-x-3 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: CATEGORY SELECTION (Type Pre-selected) ---
  return (
    <div className="bg-[#fafbfc] min-h-screen px-6 py-10">
      <div className="max-w-[1500px] mx-auto space-y-12 animate-in fade-in transition-all duration-700">
        
        {/* REFINED HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-200/60 pb-10">
          <div className="space-y-6">
            <button
              onClick={() => setSearchParams({})}
              className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.25em]"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${selectedType === 'grand' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                {selectedType === 'grand' ? <Trophy size={28} /> : <Layers size={28} />}
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  {selectedType === 'grand' ? 'Grand Categories' : 'Mock Categories'}
                </h1>
                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Select a category to manage your trials</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none shadow-sm w-72 transition-all font-medium"
                />
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
              >
                <Plus size={16} /> Register New
              </button>
          </div>
        </div>

        {/* CATEGORY GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {/* EXISTING CATEGORIES - REFINED IMAGE PROPORTIONS */}
            {filteredCategories.map((cat) => (
                <div
                    key={cat._id}
                    onClick={() => navigate(`/admin/mocktests/${cat.slug}?type=${selectedType}`)}
                    className="group relative bg-white border border-slate-100 rounded-3xl p-6 cursor-pointer hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] hover:border-indigo-100 hover:-translate-y-2 transition-all duration-700 min-h-[280px] flex flex-col"
                >
                    <div className="flex-1 w-full mb-6 flex items-center justify-center grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-[1.15]">
                        <img 
                            src={getImageUrl(cat.image)} 
                            alt={cat.name}
                            className="w-full h-full object-contain max-h-[140px]"
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-center text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {cat.name}
                        </h3>
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-500">
                            <button 
                                onClick={(e) => handleEdit(e, cat)}
                                className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, cat._id)}
                                className="p-2 bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* EMPTY STATE */}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-24 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                <Search size={32} />
             </div>
             <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm">No Results Found</h3>
             <p className="text-slate-300 font-medium text-xs mt-2 uppercase tracking-tight">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/10 animate-in fade-in duration-500">
            <div className="absolute inset-0" onClick={() => setShowAddForm(false)} />
            <div className="relative z-10 w-full max-w-lg scale-in shadow-2xl">
                <AddCategory onClose={() => setShowAddForm(false)} />
            </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/10 animate-in fade-in duration-500">
           <div className="absolute inset-0" onClick={() => setEditingCategory(null)} />
           <div className="relative z-10 w-full max-w-lg scale-in shadow-2xl">
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
