import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true }, // "2024/2025"
    year: { type: Number, required: true, min: 1, max: 6 }, // 1-4 typically
    semester: { type: Number, required: true, min: 1, max: 3 },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

feeStructureSchema.index(
  { academicYear: 1, year: 1, semester: 1 },
  { unique: true }
);

export default mongoose.model("FeeStructure", feeStructureSchema);