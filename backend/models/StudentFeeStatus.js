import mongoose from "mongoose";

/**
 * Cached per-student-per-semester fee status.
 * Recomputed on each payment approval/rejection.
 */
const studentFeeStatusSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    academicYear: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },

    requiredAmount: { type: Number, default: 0 }, // e.g., 200
    paidAmount: { type: Number, default: 0 }, // sum of approved payments
    pendingAmount: { type: Number, default: 0 }, // sum of pending payments
    balance: { type: Number, default: 0 }, // paidAmount - requiredAmount

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "credit"],
      default: "unpaid",
    },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentFeeStatusSchema.index(
  { student: 1, academicYear: 1, year: 1, semester: 1 },
  { unique: true }
);

export default mongoose.model("StudentFeeStatus", studentFeeStatusSchema);