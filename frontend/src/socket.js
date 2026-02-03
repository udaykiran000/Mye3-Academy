// frontend/src/socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (userId) => {
  // Only connect if not already connected
  if (!socket) {
    socket = io("http://localhost:8000", {
      query: { userId },
      transports: ["websocket"], // Force WebSocket for better performance
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};