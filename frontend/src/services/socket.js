import { io } from "socket.io-client";

let socket = null;

/**
 * Connect to the socket server with the current user's token.
 */
export const connectSocket = () => {
  const user = JSON.parse(localStorage.getItem("sms_user") || "null");
  if (!user?.token) {
    console.warn("No token — socket not connecting");
    return null;
  }

  if (socket?.connected) return socket;

  // Derive socket URL from API URL (strip /api)
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const socketUrl = apiUrl.replace(/\/api\/?$/, "");

  socket = io(socketUrl, {
    auth: { token: user.token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  return socket;
};

/**
 * Disconnect the socket (used on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the current socket instance (may be null).
 */
export const getSocket = () => socket;