import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudents,
  updateStudent,
} from "../../../redux/adminStudentSlice";
import api from "../../../api/axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaUpload,
} from "react-icons/fa";

const AddStudent = () => {
  const { id } = useParams(); // ✅ detect edit
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { students } = useSelector((state) => state.adminStudents);

  const isEdit = Boolean(id);
  const existing = students.find((s) => s._id === id);

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

  // ✅ Load existing data for edit
  useEffect(() => {
    if (isEdit && !existing) {
      dispatch(fetchStudents());
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
      if (
        value.length > 0 &&
        (form.password !== value && form.confirmPassword !== value)
      ) {
        setPasswordError("Passwords do not match ❌");
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

  const handleSubmit = async (e) => {
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
    }

    if (isEdit && form.password) {
      formData.append("password", form.password);
    }

    if (form.photo) {
      formData.append("photo", form.photo);
    }

    if (isEdit) {
      dispatch(updateStudent({ id, formData }))
        .unwrap()
        .then(() => {
          toast.success("Student updated successfully!");
          navigate("/admin/users/students/manage");
        });
    } else {
      api
        .post("/api/admin/users/add/students", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => {
          toast.success("Student added successfully!");
          navigate("/admin/users/students/manage");
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Something went wrong");
        });
    }
  };

  return (
    <div className="p-6">
      <div className="rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold">
          {isEdit ? "✏️ Edit Student" : "➕ Add New Student"}
        </h2>
      </div>

      <div className="bg-white shadow-xl rounded-2xl border p-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label><FaUser /> First Name *</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="beautiful-input"
              />
            </div>

            <div>
              <label><FaUser /> Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="beautiful-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label><FaEnvelope /> Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="beautiful-input"
              />
            </div>

            <div>
              <label><FaPhone /> Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="beautiful-input"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label><FaKey /> {isEdit ? "New Password (optional)" : "Password *"}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required={!isEdit}
                className={`beautiful-input ${passwordError ? "border-red-500" : ""}`}
              />
            </div>

            <div>
              <label><FaKey /> Confirm Password {isEdit ? "(optional)" : "*"}</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required={!isEdit}
                className={`beautiful-input ${passwordError ? "border-red-500" : ""}`}
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          {/* PHOTO */}
          <div>
            <label><FaUpload /> Upload Profile Photo</label>
            <div className="upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                className="hidden"
                id="photoUpload"
              />
              <label htmlFor="photoUpload" className="cursor-pointer">
                {!preview ? (
                  <p className="text-gray-500">Drag & drop or click to upload</p>
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-xl border mx-auto shadow-md"
                  />
                )}
              </label>
            </div>
          </div>

          <div className="pt-6 text-right">
            <button
              type="submit"
              disabled={passwordError !== ""}
              className="px-8 py-3 text-lg rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isEdit ? "Update Student" : "Add Student"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddStudent;
