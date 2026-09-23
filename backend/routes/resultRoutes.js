import express from "express";
import {
  getResults,
  getStudentResults,
  getMyEnteredResults,
  getPendingResults,
  createResult,
  updateResult,
  approveResult,
  rejectResult,
  bulkAction,
  deleteResult,
} from "../controllers/resultController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student — own approved results
router.get("/my", protect, (req, res, next) => {
  req.params.studentId = req.user._id;
  getStudentResults(req, res, next);
});

// Lecturer — results they entered
router.get("/my-entries", protect, authorize("lecturer"), getMyEnteredResults);

// Admin — pending queue
router.get("/pending", protect, authorize("admin"), getPendingResults);

// Admin — all results
router.get("/", protect, authorize("admin"), getResults);

// Admin — any student's results
router.get("/student/:studentId", protect, authorize("admin"), getStudentResults);

// Create — admin or lecturer
router.post("/", protect, authorize("admin", "lecturer"), createResult);

// Update — admin or lecturer
router.put("/:id", protect, authorize("admin", "lecturer"), updateResult);

// Approve / Reject — admin only
router.put("/:id/approve", protect, authorize("admin"), approveResult);
router.put("/:id/reject", protect, authorize("admin"), rejectResult);

// Bulk approve/reject — admin only
router.post("/bulk-action", protect, authorize("admin"), bulkAction);

// Delete — admin only
router.delete("/:id", protect, authorize("admin"), deleteResult);

export default router;