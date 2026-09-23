import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lecturer: { type: String, required: true },
    room: { type: String, required: true },
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
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