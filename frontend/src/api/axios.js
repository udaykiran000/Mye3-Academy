// src/api/axios.js
import axios from "axios";

// Set baseURL to the root of the server
const base =
  import.meta.env.VITE_SERVER_URL || "import.meta.env.VITE_SERVER_URL";
const instance = axios.create({
  baseURL: base,
  withCredentials: true, // <--- **FIXED: Removed the automatic '/api' append**
  headers: { "Content-Type": "application/json" },
});

export default instance;

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized
      // Prevent redirect loop if already on login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
