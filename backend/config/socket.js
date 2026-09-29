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

    io.emit("users:online", io.engine.clientsCount);
    socket.emit("users:online", io.engine.clientsCount);

    socket.on("users:online:get", () => {
      socket.emit("users:online", io.engine.clientsCount);
    });

    // ============================================================
    // WebRTC SIGNALING HANDLERS
    // ============================================================

    // Join a video room
    socket.on("video:join", ({ roomId, userInfo }) => {
      socket.join(`video:${roomId}`);
      socket.videoRoom = roomId;

      // Notify everyone else in the room
      socket.to(`video:${roomId}`).emit("video:user-joined", {
        socketId: socket.id,
        userId: socket.userId,
        ...userInfo,
      });

      // Send list of existing participants to the new user
      const room = io.sockets.adapter.rooms.get(`video:${roomId}`);
      const existingUsers = [];
      if (room) {
        room.forEach((id) => {
          if (id !== socket.id) {
            existingUsers.push({ socketId: id });
          }
        });
      }
      socket.emit("video:existing-users", existingUsers);

      console.log(`📹 ${socket.userId} joined video room ${roomId}`);
    });

    // WebRTC offer (from new peer → existing peers)
    socket.on("video:offer", ({ to, offer }) => {
      io.to(to).emit("video:offer", {
        from: socket.id,
        offer,
      });
    });

    // WebRTC answer (from existing peer → new peer)
    socket.on("video:answer", ({ to, answer }) => {
      io.to(to).emit("video:answer", {
        from: socket.id,
        answer,
      });
    });

    // ICE candidate exchange
    socket.on("video:ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("video:ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    // Leave room
    socket.on("video:leave", ({ roomId }) => {
      socket.to(`video:${roomId}`).emit("video:user-left", {
        socketId: socket.id,
      });
      socket.leave(`video:${roomId}`);
      socket.videoRoom = null;
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.userId}`);

      if (socket.videoRoom) {
        socket.to(`video:${socket.videoRoom}`).emit("video:user-left", {
          socketId: socket.id,
        });
      }

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