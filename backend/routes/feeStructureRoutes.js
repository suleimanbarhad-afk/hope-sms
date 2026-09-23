import express from "express";
import {
  listFeeStructures,
  lookupFeeStructure,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  createDefaultStructure,
} from "../controllers/feeStructureController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public lookup (auth required)
router.get("/lookup", protect, lookupFeeStructure);

// List — admin
router.get("/", protect, authorize("admin"), listFeeStructures);

// Create / bulk defaults — admin
router.post("/", protect, authorize("admin"), createFeeStructure);
router.post("/bulk-defaults", protect, authorize("admin"), createDefaultStructure);

// Update / delete — admin
router.put("/:id", protect, authorize("admin"), updateFeeStructure);
router.delete("/:id", protect, authorize("admin"), deleteFeeStructure);

export default router;