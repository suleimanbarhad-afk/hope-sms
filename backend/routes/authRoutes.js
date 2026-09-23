import express from "express";
import {
  register,
  registerLecturer,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only user creation
router.post("/register", protect, authorize("admin"), register);
router.post("/register-lecturer", protect, authorize("admin"), registerLecturer);

// Public
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Authenticated
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;