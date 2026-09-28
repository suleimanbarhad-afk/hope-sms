import express from "express";
import {
  getAtRiskStudents,
  getGPATrajectory,
  getFeeForecast,
  getEnrollmentForecast,
  getPerformanceTiers,
} from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin-only
router.use(protect, authorize("admin"));

router.get("/at-risk", getAtRiskStudents);
router.get("/gpa-trajectory/:studentId", getGPATrajectory);
router.get("/fee-forecast", getFeeForecast);
router.get("/enrollment-forecast", getEnrollmentForecast);
router.get("/performance-tiers", getPerformanceTiers);

export default router;