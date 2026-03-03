import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import cors from "cors";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";

import connectDB from "./config/connectDB.js";
import { setIOInstance } from "./socket.js";

// --- ROUTES IMPORTS ---
// Public & Auth
import authRouter from "./routes/public/authRoute.js";
import publicRoutes from "./routes/public/publicRoutes.js";

// Admin Section
import adminRoutes from "./routes/admin/adminRoutes.js";
import adminUserRoutes from "./routes/admin/adminUserRoutes.js";
import dashboardRoute from "./routes/admin/dashboardRoute.js";
import mocktestAdminRoutes from "./routes/admin/mocktestRoutes.js";
import doubtAdminRoutes from "./routes/admin/doubtAdminRoutes.js";

// Instructor Section
import instructorDashboardRoutes from "./routes/instructor/instructorDashboardRoutes.js";
import doubtInstructorRoutes from "./routes/instructor/doubtInstructorRoutes.js";
import institutionDashboardRoutes from "./routes/institution/institutionDashboardRoutes.js";

// Student Section
import studentRoute from "./routes/student/studentRoute.js";              
import paymentRoute from "./routes/student/paymentRoute.js";        
import doubtStudentRoutes from "./routes/student/doubtStudentRoutes.js";
import studentDashboardRoute from "./routes/student/studentDashboardRoute.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. CORS SETUP ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://mye3-academy-1.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// DEBUG LOGGER
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.originalUrl}`);
  next();
});

// --- 3. STATIC FILES ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/instructor", instructorDashboardRoutes);

// --- 4. API ROUTES ---

// Auth & Public
app.use("/api/auth", authRouter);
app.use("/api/public", publicRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoute);
app.use("/api/v1/dashboard", dashboardRoute);

// Admin Management
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/mocktests", mocktestAdminRoutes);
app.use("/api/admin/doubts", doubtAdminRoutes);
app.use("/api/admin/categories", publicRoutes);
app.use("/api/admin", adminRoutes);   

// Instructor Section
app.use("/api/instructor", instructorDashboardRoutes);
app.use("/api/instructor/doubts", doubtInstructorRoutes);
app.use("/api/institution", institutionDashboardRoutes);

// Student Section
app.use("/api/student", studentRoute);

app.use("/api/payment", paymentRoute);
app.use("/api/student/dashboard", studentDashboardRoute);
app.use("/api/student/doubts", doubtStudentRoutes);

// --- 5. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL_ERROR_CATCHER:", err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
});

app.get("/", (req, res) => {
  res.send("🚀 Grandtest Pro API - Fully Synchronized & Ready.");
});

// --- 6. SERVER & SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

setIOInstance(io);

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
  }
  socket.on("disconnect", () => {
    // Optional: Log disconnect if needed, kept generic
  });
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 8000;

// Store server instance globally for shutdown access
const activeServer = server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});

// 🛑 PREVENT EADDRINUSE: Handle Nodemon Restarts & Termination
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Closing HTTP server...`);
  if (activeServer) {
    activeServer.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Specific for Nodemon restarts
process.once("SIGUSR2", () => {
   if (activeServer) {
      activeServer.close(() => {
          process.kill(process.pid, "SIGUSR2");
      });
   } else {
      process.kill(process.pid, "SIGUSR2");
   }
});
