import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addInstructor, updateInstructor, fetchInstructors } from "../../../redux/instructorSlice";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaUpload,
} from "react-icons/fa";

const AddInstructor = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { instructors } = useSelector((state) => state.instructors);

  const isEdit = Boolean(id);

  const existing = instructors.find((i) => i._id === id);

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
      dispatch(fetchInstructors());
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

    // ✅ validate only when user types passwords
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

    // ✅ validate only if password typed in edit
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

    // ✅ ADD MODE - password required
    if (!isEdit) {
      formData.append("password", form.password);
      formData.append("role", "instructor");
    }

    // ✅ EDIT MODE - password optional
    if (isEdit && form.password) {
      formData.append("password", form.password);
    }

    if (form.photo) {
      formData.append("photo", form.photo);
    }

    if (isEdit) {
      dispatch(updateInstructor({ id, formData }))
        .unwrap()
        .then(() => {
          toast.success("Instructor updated successfully!");
          navigate("/admin/users/instructors/manage");
        });
    } else {
      dispatch(addInstructor(formData))
        .unwrap()
        .then(() => {
          toast.success("Instructor added successfully!");
          navigate("/admin/users/instructors/manage");
        });
    }
  };

  return (
    <div className="p-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold">
          {isEdit ? "✏️ Edit Instructor" : "➕ Add New Instructor"}
        </h2>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border p-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label><FaUser /> First Name *</label>
              <input type="text" name="firstName" value={form.firstName || ""} onChange={handleChange} required className="beautiful-input" />
            </div>
            <div>
              <label><FaUser /> Last Name *</label>
              <input type="text" name="lastName" value={form.lastName || ""} onChange={handleChange} required className="beautiful-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label><FaEnvelope /> Email *</label>
              <input type="email" name="email" value={form.email || ""} onChange={handleChange} required className="beautiful-input" />
            </div>
            <div>
              <label><FaPhone /> Phone</label>
              <input type="text" name="phone" value={form.phone || ""} onChange={handleChange} className="beautiful-input" />
            </div>
          </div>

          {/* ✅ PASSWORD ALSO IN EDIT MODE */}
          {(isEdit || !isEdit) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label><FaKey /> {isEdit ? "New Password (optional)" : "Password *"}</label>
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
                <label><FaKey /> Confirm Password {isEdit ? "(optional)" : "*"}</label>
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
          )}

          <div>
            <label><FaUpload /> Upload Profile Photo</label>
            <div className="upload-box">
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" id="photoUpload" />
              <label htmlFor="photoUpload" className="cursor-pointer">
                {!preview ? (
                  <p className="text-gray-500">Drag & drop or click to upload</p>
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
              className="px-8 py-3 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEdit ? "Update Instructor" : "Add Instructor"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddInstructor;
