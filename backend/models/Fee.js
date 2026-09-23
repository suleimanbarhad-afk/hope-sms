import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    totalFees: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date },
    status: { type: String, enum: ["paid", "partial", "unpaid"], default: "unpaid" },
  },
  { timestamps: true }
);

feeSchema.virtual("balance").get(function () {
  return this.totalFees - this.amountPaid;
});

feeSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Fee", feeSchema);