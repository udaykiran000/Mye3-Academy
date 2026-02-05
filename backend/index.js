import instructorDashboardRoutes from "./routes/instructor/instructorDashboardRoutes.js";
import dotenv from "dotenv";
dotenv.config();
import express from "express";

import connectDB from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

// Routes
import authRouter from "./routes/authRoute.js";
import mocktestRoutes from "./routes/mocktestRoutes.js";
import studentRoute from "./routes/studentRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminRoute from "./routes/adminRoute.js";
import publicMocktestRoutes from "./routes/publicMocktestRoutes.js";
import cartRoute from "./routes/cartRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import doubtStudentRoutes from "./routes/doubtStudentRoutes.js";
import doubtAdminRoutes from "./routes/doubtAdminRoutes.js";
import doubtInstructorRoutes from "./routes/doubtInstructorRoutes.js";
import { setIOInstance } from "./socket.js";

const app = express();
const port = process.env.PORT || 8000;

// Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://mye3-academy-1.onrender.com", // local frontend
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Important: respond to OPTIONS immediately
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/instructor", instructorDashboardRoutes);

// --- ROUTES MOUNTING ---
app.use("/api/auth", authRouter);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/cart", cartRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/admin/mocktests", mocktestRoutes);
app.use("/api/student", studentRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/student/doubts", doubtStudentRoutes);
app.use("/api/admin/doubts", doubtAdminRoutes);
app.use("/api/instructor/doubts", doubtInstructorRoutes);
app.use("/api/public/categories", categoryRoutes);
app.use("/api/public/mocktests", publicMocktestRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ CREATE HTTP SERVER + SOCKET.IO
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

setIOInstance(io);

io.on("connection", (socket) => {
  console.log("🔌 New client connected");
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    console.log(`👤 Socket joined room: ${userId}`);
  }
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// ✅ FIX: Use server.listen instead of app.listen
server.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
  connectDB();
});
