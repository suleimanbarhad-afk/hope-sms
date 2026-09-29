import express from "express";
import {
  startClass,
  getLiveClasses,
  getRoom,
  endClass,
} from "../controllers/videoController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/start", authorize("lecturer", "admin"), startClass);
router.get("/live", getLiveClasses);
router.get("/room/:roomId", getRoom);
router.put("/end/:roomId", authorize("lecturer", "admin"), endClass);

export default router;