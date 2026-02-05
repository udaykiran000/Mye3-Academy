// frontend/src/pages/Signup.jsx
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  Presentation,
  Sparkles,
  Smartphone,
} from "lucide-react";
import googleImg from "../assets/google.png";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const config = {
    success: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    error: "from-rose-500 to-red-600 shadow-rose-500/20",
  };
  return (
    <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-full duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${
          config[type] || config.success
        } text-white shadow-2xl backdrop-blur-md border border-white/20`}
      >
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
        <span className="text-sm font-bold tracking-tight">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:scale-125 transition-transform font-bold text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const InputField = ({
  id,
  type,
  placeholder,
  icon: Icon,
  value,
  onChange,
  isPass,
  showPass,
  togglePass,
}) => (
  <div className="relative w-full group mb-4">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
      <Icon className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
    </div>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 text-sm shadow-sm"
    />
    {isPass && (
      <button
        type="button"
        onClick={togglePass}
        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-slate-400 hover:text-indigo-600 transition-colors"
      >
        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    )}
  </div>
);

const Signup = () => {
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [toastState, setToastState] = useState({ message: "", type: "" });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const showToast = (message, type) => {
    setToastState({ message, type });
    setTimeout(() => setToastState({ message: "", type: "" }), 4000);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const googleData = {
        firstname: user.displayName?.split(" ")[0] || "User",
        lastname: user.displayName?.split(" ")[1] || "",
        email: user.email,
        avatar: user.photoURL,
        role,
      };
      const res = await api.post("/api/auth/google", googleData);
      dispatch(setUserData(res.data));
      showToast(`Welcome!`, "success");
      navigate("/");
    } catch (error) {
      showToast("Google Sign Up Failed", "error");
    } finally {
      setLoading(false);
    }
  };

 const handleSignUp = async () => {
    if (!formData.email || !formData.password)
      return showToast("Details missing", "error");
    if (formData.password !== formData.confirmPassword)
      return showToast("Passwords don't match", "error");

    try {
      setLoading(true);
      
      showToast("Sending OTP, please wait...", "success"); 

      await api.post("/api/auth/signup", { ...formData, role });
      
      showToast("OTP sent successfully!", "success");
      setStep(2);
    } catch (error) {
      showToast(error.response?.data?.message || "Signup Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return showToast("Enter 6-digit OTP", "error");
    try {
      setLoading(true);
      const result = await api.post("/api/auth/verify-otp", {
        email: formData.email,
        otp,
      });
      dispatch(setUserData(result.data.user));
      showToast("Verification Successful!", "success");
      navigate("/");
    } catch (error) {
      showToast("Verification Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADDED THIS MISSING FUNCTION
  const handleResendOtp = async () => {
    try {
      await api.post("/api/auth/resend-otp", { email: formData.email });
      showToast("New OTP sent!", "success");
    } catch (error) {
      showToast("Failed to resend OTP", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-200/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-purple-200/40 blur-[100px] rounded-full" />

      <Toast
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ message: "", type: "" })}
      />

      <div className="w-full max-w-[480px] z-10">
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-10 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 mb-4 transform rotate-3">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {step === 1
                ? "Join the community of excellence"
                : "Check your inbox for the code"}
            </p>
          </div>

          <div className="px-10 pb-12">
            {step === 1 ? (
              <div className="space-y-1 animate-in fade-in duration-500">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-6">
                  <button
                    onClick={() => setRole("student")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                      role === "student"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <GraduationCap size={18} /> Student
                  </button>
                  <button
                    onClick={() => setRole("instructor")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                      role === "instructor"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Presentation size={18} /> Instructor
                  </button>
                </div>

                <div className="flex gap-4">
                  <InputField
                    id="firstname"
                    icon={User}
                    placeholder="First"
                    value={formData.firstname}
                    onChange={handleChange}
                  />
                  <InputField
                    id="lastname"
                    icon={User}
                    placeholder="Last"
                    value={formData.lastname}
                    onChange={handleChange}
                  />
                </div>
                <InputField
                  id="email"
                  icon={Mail}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                <InputField
                  id="phoneNumber"
                  icon={Smartphone}
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                <InputField
                  id="password"
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  placeholder="Create Password"
                  isPass
                  showPass={showPass}
                  togglePass={() => setShowPass(!showPass)}
                  value={formData.password}
                  onChange={handleChange}
                />
                <InputField
                  id="confirmPassword"
                  icon={Lock}
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />

                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white h-[56px] rounded-2xl font-bold shadow-xl shadow-indigo-200 flex justify-center items-center mt-6 transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    `Create ${role} Account`
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="px-4 bg-white">One-click signup</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignUp}
                  className="w-full h-[56px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 shadow-sm font-bold text-slate-700"
                >
                  <img src={googleImg} className="w-5 h-5" alt="google" />
                  Sign up with Google
                </button>
                <p className="text-center mt-6 text-slate-500 font-medium">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-indigo-600 font-black hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-indigo-50/50 p-6 text-center rounded-[2rem] border border-indigo-100">
                  <Mail size={32} className="text-indigo-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-indigo-900 tracking-tight">
                    Code sent to your email
                  </p>
                  <p className="text-xs text-indigo-600/70 font-medium mt-1 italic">
                    {formData.email}
                  </p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-5 text-center text-4xl font-black tracking-[0.4em] bg-slate-50 border-2 border-slate-100 rounded-2xl text-indigo-600 focus:border-indigo-500 outline-none transition-all"
                  placeholder="000000"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white h-[56px] rounded-2xl font-bold shadow-xl shadow-indigo-100 flex justify-center items-center active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Verify & Get Started"
                  )}
                </button>
                <div className="flex justify-between items-center text-xs font-bold px-1">
                  <button
                    onClick={() => setStep(1)}
                    className="text-slate-400 flex items-center gap-1 hover:text-slate-600"
                  >
                    <ArrowLeft size={14} /> Edit Details
                  </button>
                  <button
                    onClick={handleResendOtp}
                    className="text-indigo-600 hover:underline"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
