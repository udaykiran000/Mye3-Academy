import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateCategory } from "../../../redux/categorySlice";
import { toast } from "react-hot-toast";
import { X, Upload, Save, Loader2 } from "lucide-react";

import { getImageUrl, handleImageError } from "../../../utils/imageHelper";

const EditCategoryModal = ({ category, onClose }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState(category.name);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(getImageUrl(category.image));
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    if (image) formData.append("image", image);

    try {
      await dispatch(updateCategory({ id: category._id, formData })).unwrap();
      toast.success("Category updated successfully");
      onClose();
    } catch (err) {
      toast.error(err || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex justify-between items-center px-4 py-3 border-b bg-[#fdfdfd]">
          <h3 className="text-[12px] font-black text-[#3e4954] uppercase tracking-wider font-poppins">Edit Category</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#7e7e7e] uppercase tracking-widest px-0.5 font-poppins">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-none px-3 py-2 text-xs text-[#3e4954] placeholder:text-slate-300 focus:border-[#21b731] outline-none transition font-poppins"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#7e7e7e] uppercase tracking-widest px-0.5 font-poppins">
              Thumbnail
            </label>
            <div className="border border-dashed border-slate-200 rounded-none p-4 text-center hover:border-[#21b731]/30 transition group cursor-pointer relative bg-[#fcfdfe]">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    onError={handleImageError}
                    className="h-24 mx-auto object-contain bg-white border border-slate-100 p-2"
                  />
                  <div className="mt-4">
                    <p className="text-[10px] text-[#21b731] font-bold uppercase font-poppins tracking-tighter">
                      Click to swap image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 py-4 flex flex-col items-center">
                  <Upload
                    size={32}
                    className="mb-2 text-slate-200 group-hover:text-[#21b731] transition"
                  />
                  <span className="text-[11px] font-bold uppercase tracking-tight font-poppins">Upload new image</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[11px] font-bold text-[#7e7e7e] hover:bg-slate-50 uppercase tracking-widest transition font-poppins"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#21b731] text-white rounded-none hover:bg-[#1a9227] disabled:opacity-50 transition-all font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-green-100 font-poppins"
            >
              {loading ? "SYNCING..." : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;
