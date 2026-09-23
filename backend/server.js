import dotenv from "dotenv";
dotenv.config();

// ⬇️ Register ALL Mongoose models at startup so .populate() works everywhere
import "./models/Department.js";
import "./models/Program.js";
import "./models/Course.js";
import "./models/User.js";
import "./models/Enrollment.js";
import "./models/Result.js";
import "./models/Attendance.js";
import "./models/Assignment.js";
import "./models/Submission.js";
import "./models/Timetable.js";
import "./models/Announcement.js";
import "./models/Notification.js";
import "./models/Fee.js";
import "./models/Payment.js";
import "./models/Document.js";
import "./models/SystemSettings.js";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});