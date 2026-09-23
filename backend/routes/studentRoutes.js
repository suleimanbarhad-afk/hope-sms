import express from "express";
import {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  toggleStudentStatus, resetStudentPassword, updateOwnProfile,
} from "../controllers/studentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/me/profile", protect, updateOwnProfile);

router.route("/")
  .get(protect, authorize("admin"), getStudents)
  .post(protect, authorize("admin"), createStudent);

router.route("/:id")
  .get(protect, authorize("admin"), getStudent)
  .put(protect, authorize("admin"), updateStudent)
  .delete(protect, authorize("admin"), deleteStudent);

router.put("/:id/status", protect, authorize("admin"), toggleStudentStatus);
router.put("/:id/reset-password", protect, authorize("admin"), resetStudentPassword);

export default router;