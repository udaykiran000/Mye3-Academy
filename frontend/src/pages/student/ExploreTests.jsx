import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IoArrowBack, IoSearch, IoTrophy, IoApps, IoShapesOutline } from 'react-icons/io5';
import { 
  fetchPublicMockTests, 
  resetPublicFilters,
  setPublicCategoryFilter,
  setPublicSearch
} from '../../redux/studentSlice';
import { fetchCategories } from '../../redux/categorySlice';
import { getImageUrl, handleImageError } from '../../utils/imageHelper';
import MockTestCard from '../../components/MockTestCard';
import { useDebounce } from '../../hooks/useDebounce';

const STAGES = {
  TYPE: 'type',
  CATEGORY: 'category',
  TESTS: 'tests'
};

export default function ExploreTests() {
  const dispatch = useDispatch();
  
  // 1. STATE MANAGEMENT
  const [stage, setStage] = useState(STAGES.TYPE);
  const [selectedType, setSelectedType] = useState(null); // 'mock' or 'grand'
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. REDUX DATA
  const { publicMocktests, publicStatus, filters } = useSelector((state) => state.students);
  const { items: categories, loading: categoriesLoading } = useSelector((state) => state.category);

  // 3. EFFECTS
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(resetPublicFilters());
  }, [dispatch]);

  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      dispatch(setPublicSearch(debouncedSearch));
    }
  }, [debouncedSearch, dispatch, filters.q]);

  // Fetch tests whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    
    // We fetch all public tests, but we'll filter them locally by type for now 
    // to keep it simple, or we could pass type to backend if supported.
    dispatch(fetchPublicMockTests(params.toString() ? `?${params.toString()}` : ""));
  }, [dispatch, filters]);

  // 4. DERIVED DATA
  const filteredTests = useMemo(() => {
    if (!publicMocktests) return [];
    return publicMocktests.filter(t => {
      if (selectedType === 'grand') return t.isGrandTest === true;
      if (selectedType === 'mock') return !t.isGrandTest;
      return true;
    });
  }, [publicMocktests, selectedType]);

  const selectedCategory = useMemo(() => {
    if (!filters.category) return null;
    return categories.find(c => c.slug === filters.category);
  }, [filters.category, categories]);

  // 5. NAVIGATION HANDLERS
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStage(STAGES.CATEGORY);
  };

  const handleCategorySelect = (slug) => {
    dispatch(setPublicCategoryFilter(slug));
    setStage(STAGES.TESTS);
  };

  const handleBack = () => {
    if (stage === STAGES.TESTS) {
      dispatch(setPublicCategoryFilter(""));
      setStage(STAGES.CATEGORY);
    } else if (stage === STAGES.CATEGORY) {
      setSelectedType(null);
      setStage(STAGES.TYPE);
    }
  };

  // 6. RENDERERS
  
  // STAGE 1: TYPE SELECTION
  const renderTypeSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
      <button 
        onClick={() => handleTypeSelect('mock')}
        className="group relative bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all duration-500 overflow-hidden text-left"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <IoApps size={120} />
        </div>
        <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
          <IoShapesOutline size={40} />
        </div>
        <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Mock Tests</h3>
        <p className="text-slate-500 leading-relaxed font-medium">Practice with chapter-wise and full-length simulated exams to sharpen your speed and accuracy.</p>
        <div className="mt-8 flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
          Explore Mock Tests <span className="group-hover:translate-x-2 transition-transform">→</span>
        </div>
      </button>

      <button 
        onClick={() => handleTypeSelect('grand')}
        className="group relative bg-slate-900 p-10 rounded-3xl border-2 border-slate-800 shadow-sm hover:shadow-2xl hover:border-amber-500 transition-all duration-500 overflow-hidden text-left"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <IoTrophy size={120} className="text-white" />
        </div>
        <div className="bg-amber-500/10 w-20 h-20 rounded-2xl flex items-center justify-center text-amber-50 mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-inner">
          <IoTrophy size={40} className="text-amber-500 group-hover:text-white" />
        </div>
        <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Grand Tests</h3>
        <p className="text-slate-400 leading-relaxed font-medium">Compete in live, scheduled state-level comprehensive exams and measure your performance against thousands.</p>
        <div className="mt-8 flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest text-xs">
          Explore Grand Tests <span className="group-hover:translate-x-2 transition-transform">→</span>
        </div>
      </button>
    </div>
  );

  // STAGE 2: CATEGORY GRID
  const renderCategoryGrid = () => (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center gap-2 mb-8 mt-4">
        <IoApps size={24} className="text-slate-400" />
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[4px]">Select Category</h2>
      </div>

      {categoriesLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-44 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat.slug)}
              className="group relative flex flex-col items-center justify-center h-44 rounded-3xl bg-white border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
              <div className="flex-1 w-full relative bg-slate-50 p-2 overflow-hidden">
                {cat.image ? (
                  <img
                    src={getImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform duration-700"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-black text-slate-200 uppercase">{cat.name?.charAt(0)}</span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors duration-500" />
              </div>
              <div className="w-full p-3 bg-white border-t border-slate-50 group-hover:bg-blue-600 transition-colors duration-500">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest group-hover:text-white transition-colors">{cat.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // STAGE 3: TEST LIST
  const renderTestList = () => (
    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-2xl ${selectedType === 'grand' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600 shadow-inner'}`}>
              {selectedType === 'grand' ? <IoTrophy size={28} /> : <IoApps size={28} />}
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedCategory?.name} Series</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-[2px]">Found {filteredTests.length} Active Tests</p>
           </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within series..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      {publicStatus === 'loading' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <MockTestCard key={test._id} test={test} isEmbedded={true} />
            ))
          ) : (
            <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                 <IoSearch size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-800">No Tests Found</h4>
              <p className="text-slate-400 max-w-xs mt-2 font-medium">We couldn't find any {selectedType === 'grand' ? 'Grand' : 'Mock'} tests in this category matching your search.</p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-6 text-blue-600 font-black uppercase tracking-widest text-xs hover:underline"
              >
                Clear Search Results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 mb-8 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            {stage !== STAGES.TYPE && (
              <button 
                onClick={handleBack}
                className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
                title="Go Back"
              >
                <IoArrowBack size={24} />
              </button>
            )}
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {stage === STAGES.TYPE && "Explore Learning Library"}
                {stage === STAGES.CATEGORY && `Explore ${selectedType === 'grand' ? 'Grand' : 'Mock'} Series`}
                {stage === STAGES.TESTS && `${selectedCategory?.name} Dashboard`}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {stage === STAGES.TYPE && "Start by choosing your preferred test format."}
                {stage === STAGES.CATEGORY && `Pick a category to discover available ${selectedType} test series.`}
                {stage === STAGES.TESTS && `Choose a specific exam to begin your assessment.`}
              </p>
            </div>
          </div>
          
          {/* Progress Breadcrumbs */}
          <div className="hidden lg:flex items-center gap-3">
             <div className={`flex flex-col items-center gap-1 ${stage === STAGES.TYPE ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${stage === STAGES.TYPE ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>1</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Choice</span>
             </div>
             <div className="w-8 h-px bg-slate-200 mb-4" />
             <div className={`flex flex-col items-center gap-1 ${stage === STAGES.CATEGORY ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${stage === STAGES.CATEGORY ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Category</span>
             </div>
             <div className="w-8 h-px bg-slate-200 mb-4" />
             <div className={`flex flex-col items-center gap-1 ${stage === STAGES.TESTS ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${stage === STAGES.TESTS ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>3</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exams</span>
             </div>
          </div>
        </div>
      </div>

      {/* STAGE CONTENT */}
      <div className="pb-10">
        {stage === STAGES.TYPE && renderTypeSelection()}
        {stage === STAGES.CATEGORY && renderCategoryGrid()}
        {stage === STAGES.TESTS && renderTestList()}
      </div>
    </div>
  );
}