import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    creditHours: { type: Number, required: true, default: 3 },

    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },

    semester: { type: Number, default: 1 },
    academicYear: { type: String, default: "2024/2025" },

    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lecturerName: { type: String, default: "" },

    // ---- Phase A: semester controls (admin-managed) ----
    attendanceOpen: { type: Boolean, default: false },
    examOpen: { type: Boolean, default: false },

    attendanceStatus: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
    },
    attendanceSubmittedAt: { type: Date },
    attendanceApprovedAt: { type: Date },
    attendanceRejectedReason: { type: String, default: "" },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

courseSchema.index({ lecturer: 1 });
courseSchema.index({ attendanceStatus: 1 });

export default mongoose.model("Course", courseSchema);