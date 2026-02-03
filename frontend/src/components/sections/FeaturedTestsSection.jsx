import React, { useState, useEffect } from "react";
import {
  Clock,
  BookOpen,
  Users,
  Rocket,
  Wallet,
  ShoppingCart,
  Play,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addItemToCart } from "../../redux/cartSlice";
import { toast } from "react-toastify";
import api from "../../api/axios";

// Helper for Stats
const StatItem = ({ icon: Icon, value, label, accentLight }) => (
  <div className="text-center">
    <Icon size={18} className={`${accentLight} mx-auto mb-1`} />
    <p className="text-lg font-black text-slate-800 leading-tight">{value}</p>
    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
      {label}
    </p>
  </div>
);

const TestCard = ({ test }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const [fetchedImageURL, setFetchedImageURL] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (!test.thumbnail) return;

    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const response = await api.get(test.thumbnail, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(response.data);
        setFetchedImageURL(url);
      } catch (error) {
        console.error("Failed to fetch mock test image via API:", error);
        setFetchedImageURL(
          "https://placehold.co/600x400?text=Image+Load+Error"
        );
      } finally {
        setLoadingImage(false);
      }
    };

    fetchImage();

    return () => {
      if (fetchedImageURL) {
        URL.revokeObjectURL(fetchedImageURL);
      }
    };
  }, [test.thumbnail]);

  const imageSource =
    fetchedImageURL || "https://placehold.co/600x400?text=Mock+Test";

  const isFree = test.isFree === true;
  const isGrand = test.isGrandTest === true;
  const students = test.totalQuestions * 37 + 500;

  const accentColor = isGrand
    ? "from-indigo-600 to-purple-500"
    : "from-cyan-600 to-blue-500";

  const accentLight = isGrand ? "text-indigo-600" : "text-cyan-600";
  const glowColor = isGrand ? "shadow-indigo-100" : "shadow-cyan-100";

  const handleLoginCheck = () => {
    if (!userData) {
      toast.error("Please login first!");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!handleLoginCheck()) return;
    dispatch(addItemToCart(test._id));
    toast.success(`${test.title} added to cart!`);
  };

  const handleStartTest = () => {
    if (!handleLoginCheck()) return;
    navigate(`/mocktests/${test._id}`);
  };

  const handleViewDetails = () => {
    navigate(`/mocktests/${test._id}`);
  };

  return (
    <div
      className={`
                group relative flex flex-col rounded-[24px] overflow-hidden cursor-pointer
                bg-white border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] 
                hover:shadow-xl hover:${glowColor}
                transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.01]
            `}
    >
      {(isFree || isGrand) && (
        <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full z-20 shadow-md uppercase tracking-widest">
          {isGrand ? "Grand Series" : "Free"}
        </span>
      )}

      <div className="relative w-full h-44 overflow-hidden">
        {loadingImage ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 animate-pulse text-slate-400 font-bold">
            Loading...
          </div>
        ) : (
          <img
            src={imageSource}
            alt={test.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
      </div>

      <Link
        to={`/mocktests/${test._id}`}
        className="p-6 flex flex-col flex-grow"
      >
        <div className="mb-4">
          {test.category?.name && (
            <p className="text-[10px] font-black text-slate-400 mb-1 tracking-[0.2em]">
              {test.category.name.toUpperCase()}
            </p>
          )}
          <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-2 transition-colors group-hover:text-indigo-600 uppercase tracking-tighter">
            {test.title}
          </h3>
        </div>

        <p className="text-slate-500 text-sm mb-5 line-clamp-2 flex-grow font-medium leading-relaxed">
          {test.description}
        </p>

        <div className="grid grid-cols-3 gap-4 border-y border-slate-50 py-5 mb-6">
          <StatItem
            icon={Clock}
            value={`${test.durationMinutes}`}
            label="Min"
            accentLight={accentLight}
          />
          <StatItem
            icon={BookOpen}
            value={`${test.totalQuestions}`}
            label="Qs"
            accentLight={accentLight}
          />
          <StatItem
            icon={Users}
            value={students.toLocaleString().replace(/,/g, " ")}
            label="Enrolled"
            accentLight={accentLight}
          />
        </div>

        <p
          className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${accentColor}`}
        >
          {isFree ? "Free" : `₹${test.price}`}
        </p>
      </Link>

      <div className="p-6 pt-0 flex gap-3 w-full">
        {isFree ? (
          <button
            onClick={handleStartTest}
            className="flex items-center justify-center gap-2 w-full text-white py-3.5 rounded-xl font-black transition bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
          >
            <Play size={18} /> Start Now
          </button>
        ) : (
          <>
            <button
              onClick={handleViewDetails}
              className={`flex items-center justify-center gap-2 w-1/2 text-white py-3.5 rounded-xl font-black transition bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs`}
            >
              <Wallet size={18} /> Buy Now
            </button>
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3.5 rounded-xl font-black transition border border-slate-100 uppercase tracking-widest text-xs"
            >
              <ShoppingCart size={18} /> Add
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// FEATURED SECTION COMPONENT
// ----------------------------------------------------

const FeaturedTestsSection = ({
  id,
  title,
  tests,
  loading,
  showViewAll,
  onViewAll,
  CardComponent: Component = TestCard, // Fixed: Renamed to Component to satisfy linter
}) => {
  const isAltBg = id === "grand-tests";
  const displayedTests = tests || [];

  return (
    <section
      className={`py-20 md:py-28 ${
        isAltBg ? "bg-slate-50" : "bg-white"
      } text-slate-800 relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://api.netlify.com/builds/grid.svg')]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
            <Rocket size={14} className="text-indigo-600 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
              Top Rated Series
            </p>
          </div>
          <h2 className="text-center text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">
            {title}
          </h2>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && displayedTests.length === 0 && (
          <p className="text-center text-slate-400 text-lg font-bold">
            No tests found.
          </p>
        )}

        <div className="grid gap-8 md:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {!loading &&
            displayedTests.map((test) => (
              <Component key={test._id} test={test} />
            ))}
        </div>

        {showViewAll && (
          <div className="text-center mt-20">
            <button
              onClick={onViewAll}
              className="px-12 py-4 font-black uppercase tracking-[0.2em] text-white bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transform hover:scale-[1.05] transition-all duration-300 text-sm"
            >
              View All Tests
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedTestsSection;
