import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },

    // ---- Phase A ----
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    academicYear: { type: String, default: "" },
    semester: { type: Number, default: 1 },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { student: 1, course: 1, date: 1 },
  { unique: true }
);
attendanceSchema.index({ course: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);