import express from "express";
import {
  getCourseAttendanceForDate,
  bulkAttendance,
  submitAttendance,
  getCourseHistory,
  getCourseStudentsSummary,
  getStudentDetail,
  listAttendanceSubmissions,
  previewAttendance,
  approveAttendance,
  rejectAttendance,
  getAttendance,
  getMyAttendance,
} from "../controllers/attendanceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---- Student ----
router.get("/my", protect, getMyAttendance);

// ---- Lecturer (and admin) ----
router.get(
  "/course/:courseId/today",
  protect,
  authorize("lecturer", "admin"),
  getCourseAttendanceForDate
);
router.get(
  "/course/:courseId/history",
  protect,
  authorize("lecturer", "admin"),
  getCourseHistory
);
router.get(
  "/course/:courseId/students-summary",
  protect,
  authorize("lecturer", "admin"),
  getCourseStudentsSummary
);
router.get(
  "/course/:courseId/student/:studentId/detail",
  protect,
  authorize("lecturer", "admin"),
  getStudentDetail
);
router.post("/bulk", protect, authorize("lecturer", "admin"), bulkAttendance);
router.post(
  "/course/:courseId/submit",
  protect,
  authorize("lecturer"),
  submitAttendance
);

// ---- Admin ----
router.get(
  "/submissions",
  protect,
  authorize("admin"),
  listAttendanceSubmissions
);
router.get(
  "/course/:courseId/preview",
  protect,
  authorize("admin"),
  previewAttendance
);
router.put(
  "/course/:courseId/approve",
  protect,
  authorize("admin"),
  approveAttendance
);
router.put(
  "/course/:courseId/reject",
  protect,
  authorize("admin"),
  rejectAttendance
);

// ---- Legacy admin ----
router.get("/", protect, authorize("admin"), getAttendance);

export default router;