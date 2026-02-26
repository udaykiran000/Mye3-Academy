import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInstitution, updateInstitution, fetchInstitutions } from "../../../redux/institutionSlice";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaUpload,
  FaBuilding,
} from "react-icons/fa";

const AddInstitution = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { institutions } = useSelector((state) => state.institutions);

  const isEdit = Boolean(id);
  const existing = institutions.find((i) => i._id === id);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    photo: null,
  });

  const [preview, setPreview] = useState(null);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (isEdit && !existing) {
      dispatch(fetchInstitutions());
    }

    if (isEdit && existing) {
      setForm({
        firstName: existing.firstname || "",
        lastName: existing.lastname || "",
        email: existing.email || "",
        phone: existing.phoneNumber || "",
        password: "",
        confirmPassword: "",
        photo: null,
      });

      if (existing.avatar) {
        setPreview(`${import.meta.env.VITE_SERVER_URL}/${existing.avatar}`);
      }
    }
  }, [isEdit, existing, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "password" || name === "confirmPassword") {
      if (form.password.length > 0 || form.confirmPassword.length > 0 || value.length > 0) {
        if (
          (name === "password" && form.confirmPassword && value !== form.confirmPassword) ||
          (name === "confirmPassword" && form.password && value !== form.password)
        ) {
          setPasswordError("Passwords do not match ❌");
        } else {
          setPasswordError("");
        }
      } else {
        setPasswordError("");
      }
    }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        return toast.error("Passwords do not match!");
      }
    }

    const formData = new FormData();
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("email", form.email);
    formData.append("phone", form.phone);

    if (!isEdit) {
      formData.append("password", form.password);
      formData.append("role", "institution");
    }

    if (isEdit && form.password) {
      formData.append("password", form.password);
    }

    if (form.photo) {
      formData.append("photo", form.photo);
    }

    if (isEdit) {
      dispatch(updateInstitution({ id, formData }))
        .unwrap()
        .then(() => {
          toast.success("Institution updated successfully!");
          navigate("/admin/users/institutions/manage");
        });
    } else {
      dispatch(addInstitution(formData))
        .unwrap()
        .then(() => {
          toast.success("Institution added successfully!");
          navigate("/admin/users/institutions/manage");
        });
    }
  };

  return (
    <div className="p-6">
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold">
          {isEdit ? "✏️ Edit Institution" : "➕ Add New Institution"}
        </h2>
      </div>

      <div className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] rounded-2xl border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaBuilding /> Institution Name *</label>
              <input type="text" name="firstName" value={form.firstName || ""} onChange={handleChange} required className="beautiful-input" placeholder="e.g. Acme Academy" />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaUser /> Coordinator / Contact Person</label>
              <input type="text" name="lastName" value={form.lastName || ""} onChange={handleChange} className="beautiful-input" placeholder="e.g. John Doe" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaEnvelope /> Email *</label>
              <input type="email" name="email" value={form.email || ""} onChange={handleChange} required className="beautiful-input" />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaPhone /> Phone</label>
              <input type="text" name="phone" value={form.phone || ""} onChange={handleChange} className="beautiful-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaKey /> {isEdit ? "New Password (optional)" : "Password *"}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`beautiful-input ${passwordError ? "border-red-500" : ""}`}
                required={!isEdit}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-600"><FaKey /> Confirm Password {isEdit ? "(optional)" : "*"}</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`beautiful-input ${passwordError ? "border-red-500" : ""}`}
                required={!isEdit}
              />
              {passwordError && <p className="text-red-600 text-sm mt-1">{passwordError}</p>}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-600"><FaUpload /> Upload Logo / Profile Photo</label>
            <div className="upload-box relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-indigo-500 transition-all text-center">
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="photoUpload" />
              <label htmlFor="photoUpload" className="cursor-pointer block">
                {!preview ? (
                  <div className="space-y-2">
                    <FaUpload className="mx-auto text-slate-400 text-3xl" />
                    <p className="text-slate-500 font-medium">Click to upload your institution logo</p>
                  </div>
                ) : (
                  <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border mx-auto shadow-md" />
                )}
              </label>
            </div>
          </div>

          <div className="pt-6 text-right">
            <button
              type="submit"
              disabled={passwordError !== ""}
              className="px-10 py-4 text-lg font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isEdit ? "Update Institution" : "Add Institution"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddInstitution;
