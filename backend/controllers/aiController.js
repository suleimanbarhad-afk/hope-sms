import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatMessage from "../models/ChatMessage.js";
import { buildRAGContext } from "../services/aiContextBuilder.js";

// 👇 UPDATED: Use gemini-3.8-flash (current model)
const MODEL = "gemini-3.8-flash";

const systemPrompt = (user, context) => `
You are the AI assistant for Hope Secondary School's Student Management System.

You have access to the following REAL data from the school database:

${context}

=== INSTRUCTIONS ===
- You are speaking to: ${user.firstName} ${user.lastName} (role: ${user.role})
- Answer questions using ONLY the data provided above.
- Be concise and friendly. Use plain language.
- If asked about something not in your data, politely say you don't have that information.
- For dates, money, marks — always use exact values from the context above.
- Never invent student names, grades, or numbers.
- If the user asks about another student (and they're a student), politely refuse.
- Keep answers under 4 sentences unless asked for detail.
- Use markdown for lists when helpful.
`;

// ============================================================
// POST /api/ai/chat
// ============================================================
export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "AI is not configured. Ask admin to set GEMINI_API_KEY.",
      });
    }

    // 1. Save user's message
    await ChatMessage.create({
      user: req.user._id,
      role: "user",
      content: message.trim(),
    });

    // 2. Build RAG context (fetches real data based on role)
    const context = await buildRAGContext(req.user);

    // 3. Load last 6 messages for conversation continuity
    const history = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .then((msgs) => msgs.reverse().slice(0, -1));

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt(req.user, context) }],
      },
      ...history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text: message.trim() }],
      },
    ];

    const result = await model.generateContent({ contents });
    const response = result.response.text();

    // 5. Save assistant reply
    const saved = await ChatMessage.create({
      user: req.user._id,
      role: "assistant",
      content: response,
      metadata: {
        model: MODEL,
        tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
      },
    });

    res.json({
      reply: response,
      messageId: saved._id,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error("AI chat error:", err.message);
    if (err.message?.includes("API_KEY")) {
      return res.status(500).json({ message: "Invalid AI API key" });
    }
    if (err.message?.includes("quota") || err.message?.includes("429")) {
      return res.status(429).json({
        message: "AI is busy right now. Please try again in a moment.",
      });
    }
    next(err);
  }
};

// ============================================================
// GET /api/ai/history
// ============================================================
export const getChatHistory = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /api/ai/history
// ============================================================
export const clearChatHistory = async (req, res, next) => {
  try {
    const result = await ChatMessage.deleteMany({ user: req.user._id });
    res.json({ message: `${result.deletedCount} messages cleared` });
  } catch (err) {
    next(err);
  }
};