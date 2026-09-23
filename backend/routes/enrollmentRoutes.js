import express from "express";
import {
  listEnrollments,
  createEnrollment,
  bulkEnroll,
  deleteEnrollment,
  listCourseStudents,
  listAvailableStudents,
} from "../controllers/enrollmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require admin
router.use(protect, authorize("admin"));

router.route("/")
  .get(listEnrollments)
  .post(createEnrollment);

router.post("/bulk", bulkEnroll);

router.get("/course/:courseId/students", listCourseStudents);
router.get("/available-students/:courseId", listAvailableStudents);

router.delete("/:id", deleteEnrollment);

export default router;