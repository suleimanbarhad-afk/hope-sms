import mongoose from "mongoose";

const videoRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["live", "ended"],
      default: "live",
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    endedAt: { type: Date },
  },
  { timestamps: true }
);

videoRoomSchema.index({ course: 1, status: 1 });

export default mongoose.model("VideoRoom", videoRoomSchema);