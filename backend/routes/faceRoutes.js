import express from "express";
import {
  enrollFace,
  getFaceStatus,
  verifyAndMark,
  studentsWithoutFace,
} from "../controllers/faceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Student endpoints
router.post("/enroll", authorize("student"), enrollFace);
router.get("/status", authorize("student"), getFaceStatus);
router.post("/verify-and-mark", authorize("student"), verifyAndMark);

// Admin endpoints
router.get("/students-without-face", authorize("admin"), studentsWithoutFace);

export default router;