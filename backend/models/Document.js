import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["transcript", "admission", "id", "certificate", "other"], default: "other" },
    fileUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);