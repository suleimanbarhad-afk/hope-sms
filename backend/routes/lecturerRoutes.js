import express from "express";
import {
  getLecturerDashboard,
  getMyCourses,
  getMyStudents,
  getMyProfile,
  updateMyProfile,
  listLecturers,
  toggleLecturerStatus,
  deleteLecturer,
  listLecturersSimple,
} from "../controllers/lecturerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------- ADMIN: manage lecturers ----------
router.get("/", protect, authorize("admin"), listLecturers);
router.get("/list", protect, authorize("admin"), listLecturersSimple);
router.put("/:id/status", protect, authorize("admin"), toggleLecturerStatus);
router.delete("/:id", protect, authorize("admin"), deleteLecturer);

// ---------- LECTURER: own data ----------
router.get("/dashboard", protect, authorize("lecturer"), getLecturerDashboard);
router.get("/courses", protect, authorize("lecturer"), getMyCourses);
router.get("/students", protect, authorize("lecturer"), getMyStudents);
router.get("/profile", protect, authorize("lecturer"), getMyProfile);
router.put("/profile", protect, authorize("lecturer"), updateMyProfile);

export default router;