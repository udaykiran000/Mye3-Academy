import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, X, Loader2, Save } from "lucide-react";
import { useDispatch } from "react-redux";
import { addCategory, fetchCategories } from "../../../redux/categorySlice";
import api from "../../../api/axios";

const AddCategory = ({ onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = (e) => {
    e.target.src = "/logo.png";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      toast.error("Required fields missing");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);

    setLoading(true);
    try {
      await dispatch(addCategory(formData)).unwrap();
      dispatch(fetchCategories()); // Explicit re-fetch to ensure UI sync

      toast.success("Category added successfully");
      setName("");
      setImage(null);
      setPreview("");
      if (onClose) onClose(); // Auto-close modal after success
    } catch (err) {
      toast.error(err || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-none max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-[#fdfdfd]">
        <h2 className="text-[12px] font-black text-[#3e4954] uppercase tracking-wider font-poppins">
          New Category
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-50 transition text-slate-400"
        >
          <X size={14} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#7e7e7e] uppercase tracking-widest px-0.5 font-poppins">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-none px-3 py-2 text-xs text-[#3e4954] placeholder:text-slate-300 focus:border-[#21b731] outline-none transition font-poppins"
            placeholder="e.g. RRB NTPC"
            required
          />
        </div>

        {/* Upload Section */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#7e7e7e] uppercase tracking-widest px-0.5 font-poppins">
            Thumbnail
          </label>
          <div className="relative border border-dashed border-slate-200 rounded-none bg-[#fcfdfe] p-4 hover:border-[#21b731]/30 transition group flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <Upload
              className="text-slate-300 group-hover:text-[#21b731] transition mb-2"
              size={24}
            />
            <p className="text-[11px] text-[#7e7e7e] font-bold uppercase tracking-tight font-poppins">
              Drop or Click to Upload
            </p>
          </div>

          {/* Preview Section */}
          {preview && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded-none animate-in fade-in">
              <img
                src={preview}
                alt="Asset Preview"
                onError={handleImageError}
                className="w-14 h-14 object-contain bg-white border border-slate-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#21b731] font-bold uppercase font-poppins">
                  Image Ready
                </p>
                <p className="text-[10px] text-[#7e7e7e] truncate italic font-poppins">
                  Thumbnail processed for upload...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-none text-white font-bold text-[12px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-sm font-poppins
                    ${
                      loading
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-[#21b731] hover:bg-[#1a9227] shadow-green-100/50 active:scale-95"
                    }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? "SAVING DATA..." : "CREATE CATEGORY"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
