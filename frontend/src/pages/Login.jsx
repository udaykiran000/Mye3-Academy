// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from "lucide-react";

import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import googleImg from "../assets/google.png";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";

// ------------------ VIBRANT TOAST ------------------
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const config = {
    success: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    info: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    error: "from-rose-500 to-red-600 shadow-rose-500/20",
  };

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-6 right-6 z-[100] animate-in slide-in-from-right-full duration-300`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${
          config[type] || config.info
        } text-white shadow-2xl backdrop-blur-md border border-white/20`}
      >
        <Icon size={20} className="animate-pulse" />
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

// ------------------ SLEEK INPUT ------------------
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
  <div className="relative w-full mb-5 group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
      <Icon className="text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
    </div>

    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl
                 text-slate-800 placeholder-slate-400 font-medium
                 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 
                 outline-none transition-all duration-300 text-sm shadow-sm"
    />

    {isPass && (
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-slate-400 hover:text-indigo-600 transition-colors"
        onClick={togglePass}
      >
        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    )}
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastState, setToastState] = useState({ message: "", type: "" });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const showToast = (message, type) => {
    setToastState({ message, type });
    setTimeout(() => setToastState({ message: "", type: "" }), 4000);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const googleData = {
        firstname: user.displayName?.split(" ")[0] || "User",
        lastname: user.displayName?.split(" ")[1] || "",
        email: user.email,
        avatar: user.photoURL,
      };
      const res = await api.post("/api/auth/google", googleData);
      dispatch(setUserData(res.data));
      showToast("Signed in successfully!", "success");
      navigate("/");
    } catch (err) {
      showToast("Google connection failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return showToast("Credentials required", "error");
    try {
      setLoading(true);
      const result = await api.post("/api/auth/login", { email, password });
      dispatch(setUserData(result.data));
      showToast("Welcome back!", "success");
      navigate("/");
    } catch (error) {
      if (error.response?.status === 403) {
        showToast("Verification needed. Check email.", "info");
        await api.post("/api/auth/resend-otp", { email });
        setStep(2);
      } else {
        showToast(error.response?.data?.message || "Login failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return showToast("Invalid OTP format", "error");
    try {
      setLoading(true);
      const result = await api.post("/api/auth/verify-otp", { email, otp });
      dispatch(setUserData(result.data.user));
      showToast("Email verified!", "success");
      navigate("/");
    } catch (error) {
      showToast("Wrong OTP. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center p-6 relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/40 blur-[120px] rounded-full" />

      <Toast
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState({ message: "", type: "" })}
      />

      <div className="w-full max-w-[440px] z-10">
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* HEADER */}
          <div className="px-10 pt-12 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 mb-6 transform -rotate-6">
              <Sparkles className="text-white" size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {step === 1 ? "Sign In" : "Verify It's You"}
            </h1>
            <p className="text-slate-500 font-medium">
              {step === 1
                ? "Welcome back to MYE 3 Academy"
                : `Enter the code sent to your inbox`}
            </p>
          </div>

          <div className="px-10 pb-12">
            {step === 1 ? (
              <form onSubmit={handleLogin} className="space-y-2">
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="relative">
                  <InputField
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    isPass
                    showPass={showPass}
                    togglePass={() => setShowPass(!showPass)}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => navigate("/forget-password")}
                    className="absolute right-1 -bottom-5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-[56px] rounded-2xl font-bold shadow-xl shadow-indigo-200 flex justify-center items-center mt-10 transition-all active:scale-95 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="px-4 bg-white">Secure Social Login</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-[56px] bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors shadow-sm font-bold text-slate-700"
                >
                  <img src={googleImg} className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>

                <p className="text-center mt-8 text-slate-500 font-medium">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="text-indigo-600 font-black hover:underline underline-offset-4"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            ) : (
              /* OTP FORM */
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
                    <KeyRound size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 tracking-tighter italic">
                      {email}
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Verification Required
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full py-5 text-center text-4xl font-black tracking-[0.4em] bg-slate-50 border-2 border-slate-100 rounded-2xl text-indigo-600 focus:border-indigo-500 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all"
                  placeholder="000000"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white h-[56px] rounded-2xl font-bold shadow-xl shadow-indigo-100 flex justify-center items-center transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Verify & Start Now"
                  )}
                </button>

                <div className="flex justify-between items-center text-xs font-bold px-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 flex items-center gap-1 hover:text-slate-600"
                  >
                    <ArrowLeft size={14} /> Change Email
                  </button>
                  <button
                    type="button"
                    onClick={() => api.post("/api/auth/resend-otp", { email })}
                    className="text-indigo-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
