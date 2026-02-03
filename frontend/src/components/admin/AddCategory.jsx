import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, X, Loader2, Save } from "lucide-react";
import api from "../../api/axios";

const AddCategory = ({ onClose }) => {
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
      const res = await api.post("/api/admin/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data.message);
      setName("");
      setImage(null);
      setPreview("");
      window.dispatchEvent(new Event("categoryAdded"));
      if (onClose) onClose(); // Auto-close modal after success
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
      {/* Small Header Section */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">
          New Segment Entry
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200 rounded-md transition text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Title Input - Compact & Sharp */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
            Category Identifier
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
            placeholder="e.g. SSC CGL / RAILWAYS"
            required
          />
        </div>

        {/* Upload Logic - Human Friendly & Small */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
            Graphic Asset
          </label>
          <div className="relative border border-dashed border-slate-200 rounded-lg bg-slate-50 p-4 hover:border-indigo-200 transition group flex items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="text-center space-y-1 flex flex-col items-center">
              <Upload
                className="text-slate-300 group-hover:text-indigo-400 transition"
                size={20}
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                Browse Local Files
              </p>
            </div>
          </div>

          {/* Miniature Image Preview */}
          {preview && (
            <div className="mt-3 flex items-center gap-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 animate-in fade-in">
              <img
                src={preview}
                alt="Asset Preview"
                className="w-12 h-12 object-contain rounded-md bg-white border border-indigo-100"
              />
              <div>
                <p className="text-[10px] text-indigo-500 font-bold uppercase">
                  Ready to Commit
                </p>
                <p className="text-[9px] text-slate-400 truncate max-w-[200px] italic">
                  Asset loaded for segment indexing...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard-Ready Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-bold text-[13px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-sm
                    ${
                      loading
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100/50 active:scale-95"
                    }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? "Processing Database..." : "Publish Category"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
