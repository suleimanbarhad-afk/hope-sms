import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // ---- Component marks ----
    attendanceMarks: { type: Number, default: 0, min: 0, max: 10 },
    courseworkMarks: { type: Number, default: 0, min: 0, max: 10 },
    testMarks: { type: Number, default: 0, min: 0, max: 10 },
    examMarks: { type: Number, default: 0, min: 0, max: 70 },
    examLocked: { type: Boolean, default: false },

    // ---- Computed ----
    totalMarks: { type: Number, default: 0, min: 0, max: 100 },
    grade: { type: String },
    gradePoint: { type: Number },

    // ---- Metadata ----
    semester: { type: Number, required: true },
    academicYear: { type: String, required: true },

    // ---- Approval workflow ----
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

resultSchema.index(
  { student: 1, course: 1, semester: 1, academicYear: 1 },
  { unique: true }
);
resultSchema.index({ status: 1 });
resultSchema.index({ enteredBy: 1 });

export default mongoose.model("Result", resultSchema);