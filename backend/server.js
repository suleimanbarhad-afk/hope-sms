import dotenv from "dotenv";
dotenv.config();

// Register all Mongoose models at startup
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

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
  });
});