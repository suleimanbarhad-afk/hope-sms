import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    academicYear: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },

    amount: { type: Number, required: true, min: 0 },
    reference: { type: String, required: true }, // student-entered txn ID
    paymentDate: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ["mobile_money", "bank_transfer", "cash", "cheque", "other"],
      default: "mobile_money",
    },
    receiptImage: { type: String, default: "" },
    notes: { type: String, default: "" },

    // ---- Verification workflow ----
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ academicYear: 1, year: 1, semester: 1 });
paymentSchema.index({ reference: 1 });

export default mongoose.model("Payment", paymentSchema);