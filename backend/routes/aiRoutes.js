import express from "express";
import {
  chat,
  getChatHistory,
  clearChatHistory,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many AI requests. Wait a minute." },
});

router.use(protect);

router.post("/chat", aiLimiter, chat);
router.get("/history", getChatHistory);
router.delete("/history", clearChatHistory);

export default router;