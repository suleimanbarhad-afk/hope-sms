import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // optional — set when a lecturer is assigned
    },
    lecturerName: { type: String, default: "" }, // cached display name
    room: { type: String, required: true },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    year: { type: Number },
    semester: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Timetable", timetableSchema);