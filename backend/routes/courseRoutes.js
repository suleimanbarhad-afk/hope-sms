import express from "express";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  toggleCourseGates,
} from "../controllers/courseController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Specific routes BEFORE generic /:id
router.get("/my", protect, authorize("student"), getMyCourses);
router.put("/:id/gates", protect, authorize("admin"), toggleCourseGates);

router.route("/")
  .get(protect, getCourses)
  .post(protect, authorize("admin"), createCourse);

router.route("/:id")
  .get(protect, getCourse)
  .put(protect, authorize("admin"), updateCourse)
  .delete(protect, authorize("admin"), deleteCourse);

export default router;