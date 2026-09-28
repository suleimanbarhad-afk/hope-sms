import mongoose from "mongoose";

const faceDataSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // 128-dimensional descriptor from face-api.js
    descriptor: {
      type: [Number],
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("FaceData", faceDataSchema);