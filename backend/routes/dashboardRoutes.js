import express from "express";
import { adminDashboard, studentDashboard } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin/dashboard", protect, authorize("admin"), adminDashboard);
router.get("/student/dashboard", protect, authorize("student"), studentDashboard);

export default router;