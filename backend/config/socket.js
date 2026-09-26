import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId} (${socket.userRole})`);

    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);

    // Broadcast to everyone
    io.emit("users:online", io.engine.clientsCount);

    // Also send the current count directly to the newly connected socket
    socket.emit("users:online", io.engine.clientsCount);

    // Handle manual requests (in case the initial event was missed)
    socket.on("users:online:get", () => {
      socket.emit("users:online", io.engine.clientsCount);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);
      io.emit("users:online", io.engine.clientsCount);
    });
  });

  return io;
};

export const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToRole = (role, event, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
};

export const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

export const getIO = () => io;