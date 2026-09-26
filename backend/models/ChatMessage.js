import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

chatMessageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);