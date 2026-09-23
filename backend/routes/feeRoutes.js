import express from "express";
import {
  getMyFees,
  createMyPayment,
  listPayments,
  approvePayment,
  rejectPayment,
  adminCreatePayment,
  listStudentFeeStatuses,
  getFeeStats,
  getSettings,
  updateSettings,
} from "../controllers/feesController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---- Student ----
router.get("/my", protect, authorize("student"), getMyFees);
router.post("/my/payment", protect, authorize("student"), createMyPayment);

// ---- Admin ----
router.get("/payments", protect, authorize("admin"), listPayments);
router.put("/payments/:id/approve", protect, authorize("admin"), approvePayment);
router.put("/payments/:id/reject", protect, authorize("admin"), rejectPayment);
router.post("/payments/admin", protect, authorize("admin"), adminCreatePayment);

router.get("/statuses", protect, authorize("admin"), listStudentFeeStatuses);
router.get("/stats", protect, authorize("admin"), getFeeStats);

router.get("/settings", protect, getSettings);
router.put("/settings", protect, authorize("admin"), updateSettings);

export default router;