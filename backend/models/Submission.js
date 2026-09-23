import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["submitted", "late", "graded"], default: "submitted" },
    grade: { type: Number },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);