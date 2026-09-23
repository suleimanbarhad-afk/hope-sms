import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
    attachment: { type: String, default: "" },
    targetDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    targetProgram: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);