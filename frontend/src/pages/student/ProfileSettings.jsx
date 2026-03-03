import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateStudentProfile,
  fetchStudentProfile,
  clearProfileStatus,
} from "../../redux/studentSlice";
import {
  Camera, Save, Loader2, Lock, User, Phone, Mail,
  CheckCircle2, AlertCircle, ShieldCheck, Pencil,
} from "lucide-react";

/* ─── Reusable field ──────────────────────────────────── */
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-[2px]">
      {Icon && <Icon size={11} className="text-slate-400" />}
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ disabled, ...props }) => (
  <input
    {...props}
    disabled={disabled}
    className={`w-full px-4 py-3 text-sm font-medium rounded-xl border transition-all outline-none
      ${disabled
        ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
        : "bg-white border-slate-200 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 hover:border-slate-300"
      }`}
  />
);

/* ─── Main component ──────────────────────────────────── */
const ProfileSettings = () => {
  const dispatch = useDispatch();

  const {
    studentProfile,
    profileLoading,
    profileUpdateStatus,
    profileUpdateError,
    profileSuccessMessage,
  } = useSelector((s) => s.students);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phoneNumber: "",
    password: "", confirmPassword: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [pwMismatch, setPwMismatch] = useState(false);

  useEffect(() => { dispatch(fetchStudentProfile()); }, [dispatch]);

  useEffect(() => {
    if (studentProfile) {
      setFormData((p) => ({
        ...p,
        firstName:   studentProfile.firstname    || "",
        lastName:    studentProfile.lastname     || "",
        phoneNumber: studentProfile.phoneNumber  || "",
        password: "", confirmPassword: "",
      }));
      if (studentProfile.avatar) {
        const baseUrl = (import.meta.env.VITE_SERVER_URL || "http://localhost:8000").replace(/\/$/, "");
        const rawPath = studentProfile.avatar.replace(/\\/g, "/");
        const fullUrl = rawPath.startsWith("http")
          ? rawPath
          : `${baseUrl}/${rawPath.replace(/^\/+/, "")}`;
        setAvatarPreview(fullUrl);
        setAvatarFile(null); // clear selected file so preview uses server URL
      }
    }
  }, [studentProfile]);


  useEffect(() => {
    if (profileUpdateStatus === "succeeded" || profileUpdateStatus === "failed") {
      const t = setTimeout(() => dispatch(clearProfileStatus()), 3500);
      return () => clearTimeout(t);
    }
  }, [profileUpdateStatus, dispatch]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (e.target.name === "confirmPassword" || e.target.name === "password") {
      setPwMismatch(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setPwMismatch(true); return;
    }
    const fd = new FormData();
    fd.append("firstName",   formData.firstName);
    fd.append("lastName",    formData.lastName);
    fd.append("phoneNumber", formData.phoneNumber);
    if (formData.password) fd.append("password", formData.password);
    if (avatarFile)        fd.append("avatar",   avatarFile);
    dispatch(updateStudentProfile(fd));
  };

  const initials = `${formData.firstName?.charAt(0) || ""}${formData.lastName?.charAt(0) || ""}` || "U";

  if (profileLoading && !studentProfile) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-4">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-lg">
          <User size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Profile Settings</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Manage your account details</p>
        </div>
      </div>

      {/* ── Status messages ── */}
      {profileUpdateStatus === "succeeded" && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
          <CheckCircle2 size={16} />{profileSuccessMessage || "Profile updated successfully!"}
        </div>
      )}
      {profileUpdateStatus === "failed" && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          <AlertCircle size={16} />{profileUpdateError || "Update failed. Please try again."}
        </div>
      )}
      {pwMismatch && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
          <AlertCircle size={16} />Passwords do not match.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Avatar section */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-8 flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-2 border-white/20 overflow-hidden shadow-xl bg-slate-600">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/80">{initials}</div>
                }
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-indigo-500 hover:bg-indigo-400 rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110"
              >
                <Camera size={13} className="text-white" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            {/* Name + email header */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-white leading-tight truncate">
                {formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : "Your Name"}
              </h3>
              <p className="text-sm text-white/50 font-medium mt-0.5 truncate">{studentProfile?.email || ""}</p>
              <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest">
                <ShieldCheck size={9} />Student Account
              </span>
            </div>

            {/* Edit note */}
            <div className="hidden lg:flex items-center gap-1.5 text-white/30 text-[10px] font-bold uppercase tracking-widest">
              <Pencil size={10} />Edit below
            </div>
          </div>

          {/* Form fields */}
          <div className="p-6 space-y-5">

            {/* Name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" icon={User}>
                <Input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" />
              </Field>
              <Field label="Last Name" icon={User}>
                <Input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" />
              </Field>
            </div>

            {/* Email (readonly) */}
            <Field label="Email Address" icon={Mail}>
              <Input type="email" value={studentProfile?.email || ""} disabled />
            </Field>

            {/* Phone */}
            <Field label="Phone Number" icon={Phone}>
              <Input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter phone number" />
            </Field>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-slate-100" />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                <Lock size={10} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Change Password</span>
              </div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password" icon={Lock}>
                <Input
                  type="password" name="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="Leave blank to keep current"
                />
              </Field>
              <Field label="Confirm Password" icon={Lock}>
                <Input
                  type="password" name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange}
                  placeholder="Re-enter new password"
                  className={pwMismatch ? "border-rose-400 focus:ring-rose-100" : ""}
                />
              </Field>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileUpdateStatus === "loading"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              >
                {profileUpdateStatus === "loading"
                  ? <><Loader2 size={14} className="animate-spin" />Saving...</>
                  : <><Save size={14} />Save Changes</>
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
