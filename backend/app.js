import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import lecturerRoutes from "./routes/lecturerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import feeStructureRoutes from "./routes/feeStructureRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import feeRoutes from "./routes/feeRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import faceRoutes from "./routes/faceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api", limiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/fee-structures", feeStructureRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/face", faceRoutes);
app.use("/api", dashboardRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;