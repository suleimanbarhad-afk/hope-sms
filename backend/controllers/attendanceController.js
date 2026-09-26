import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Result from "../models/Result.js";
import Notification from "../models/Notification.js";
import SystemSettings from "../models/SystemSettings.js";
import User from "../models/User.js";
import { calculateGrade, calculateTotal } from "../utils/gradeCalculator.js";
import { notifyUser } from "../utils/notificationHelper.js";
import { emitToRole } from "../config/socket.js";

// ============================================================
// LECTURER — Get enrolled students + today's marks for a course
// ============================================================
export const getCourseAttendanceForDate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const dateStr = req.query.date;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own courses" });
    }

    const enrollments = await Enrollment.find({ course: courseId }).populate(
      "student",
      "firstName lastName studentId email"
    );

    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.find({
      course: courseId,
      date: { $gte: start, $lte: end },
    });

    const existingMap = {};
    existing.forEach((a) => {
      existingMap[a.student.toString()] = a.status;
    });

    res.json({
      course,
      date: start,
      students: enrollments,
      existingMarks: existingMap,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LECTURER/ADMIN — Save or update attendance for one date
// ============================================================
export const bulkAttendance = async (req, res, next) => {
  try {
    const { course, date, records } = req.body;

    if (!course || !date || !Array.isArray(records)) {
      return res
        .status(400)
        .json({ message: "course, date, and records are required" });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (!courseDoc.attendanceOpen) {
      return res
        .status(403)
        .json({ message: "Attendance entry is not open for this course" });
    }

    if (courseDoc.attendanceStatus === "approved") {
      return res
        .status(403)
        .json({ message: "Attendance is already approved and locked" });
    }

    if (
      req.user.role === "lecturer" &&
      (!courseDoc.lecturer ||
        courseDoc.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only mark your own courses" });
    }

    const dateObj = new Date(date);
    const ops = records.map((r) => ({
      updateOne: {
        filter: { student: r.student, course, date: dateObj },
        update: {
          student: r.student,
          course,
          date: dateObj,
          status: r.status,
          markedBy: req.user._id,
          academicYear: courseDoc.academicYear,
          semester: courseDoc.semester,
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(ops);

    res.json({
      message: "Attendance saved",
      count: result.modifiedCount + result.upsertedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LECTURER — Submit attendance to admin — LIVE
// ============================================================
export const submitAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only submit your own courses" });
    }

    if (course.attendanceStatus === "submitted") {
      return res.status(400).json({ message: "Already submitted" });
    }

    if (course.attendanceStatus === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    const distinctDates = await Attendance.distinct("date", { course: courseId });
    if (distinctDates.length === 0) {
      return res
        .status(400)
        .json({ message: "No attendance records to submit" });
    }

    const warning =
      distinctDates.length < 20
        ? `Only ${distinctDates.length} class days marked — review before approving.`
        : "";

    course.attendanceStatus = "submitted";
    course.attendanceSubmittedAt = new Date();
    await course.save();

    // Notify admins — LIVE
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const a of admins) {
      await notifyUser({
        recipient: a._id,
        title: `Attendance submitted: ${course.code}`,
        message: `${course.name} attendance has been submitted for approval. ${warning}`,
        type: "general",
        link: "/admin/attendance-approvals",
      });
    }

    // Live count change to admins
    emitToRole("admin", "attendance:pending-changed", { delta: 1 });

    res.json({
      message: "Attendance submitted to admin",
      daysMarked: distinctDates.length,
      warning,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LECTURER/ADMIN — Attendance history
// ============================================================
export const getCourseHistory = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own courses" });
    }

    const records = await Attendance.find({ course: courseId });

    const dayMap = {};
    records.forEach((r) => {
      const key = new Date(r.date).toISOString().split("T")[0];
      if (!dayMap[key]) {
        dayMap[key] = { date: key, present: 0, late: 0, absent: 0 };
      }
      dayMap[key][r.status] += 1;
    });

    const history = Object.values(dayMap).sort((a, b) =>
      a.date < b.date ? 1 : -1
    );

    res.json(history);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LECTURER/ADMIN — Per-student attendance summary
// ============================================================
export const getCourseStudentsSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own courses" });
    }

    const enrollments = await Enrollment.find({ course: courseId }).populate(
      "student",
      "firstName lastName studentId email"
    );

    const records = await Attendance.find({ course: courseId });

    const daySet = new Set();
    records.forEach((r) =>
      daySet.add(new Date(r.date).toISOString().split("T")[0])
    );
    const totalDays = daySet.size;

    const byStudent = {};
    records.forEach((r) => {
      const sid = r.student.toString();
      if (!byStudent[sid]) {
        byStudent[sid] = { present: 0, late: 0, absent: 0 };
      }
      byStudent[sid][r.status] += 1;
    });

    const students = enrollments.map((e) => {
      const sid = e.student._id.toString();
      const s = byStudent[sid] || { present: 0, late: 0, absent: 0 };
      const attended = s.present + s.late;
      const percent = totalDays
        ? +((attended / totalDays) * 100).toFixed(1)
        : 0;
      const marks = totalDays
        ? percent >= 75
          ? +((attended / totalDays) * 10).toFixed(2)
          : 0
        : 0;
      return {
        student: e.student,
        present: s.present,
        late: s.late,
        absent: s.absent,
        total: totalDays,
        attended,
        percent,
        marks,
      };
    });

    students.sort((a, b) =>
      (a.student.studentId || "").localeCompare(b.student.studentId || "")
    );

    res.json({ totalDays, students });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LECTURER/ADMIN — Full day-by-day record for one student
// ============================================================
export const getStudentDetail = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own courses" });
    }

    const student = await User.findById(studentId).select(
      "firstName lastName studentId email"
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    const records = await Attendance.find({
      course: courseId,
      student: studentId,
    }).sort({ date: -1 });

    res.json({
      student,
      records: records.map((r) => ({
        _id: r._id,
        date: r.date,
        status: r.status,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — List all submissions
// ============================================================
export const listAttendanceSubmissions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.attendanceStatus = req.query.status;
    else filter.attendanceStatus = { $in: ["submitted", "approved", "rejected"] };

    const courses = await Course.find(filter)
      .populate("lecturer", "firstName lastName email staffId")
      .populate("department", "name code")
      .sort({ attendanceSubmittedAt: -1 });

    const enriched = await Promise.all(
      courses.map(async (c) => {
        const days = await Attendance.distinct("date", { course: c._id });
        const students = await Enrollment.countDocuments({ course: c._id });
        return {
          ...c.toObject(),
          daysMarked: days.length,
          enrolledStudents: students,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Preview attendance
// ============================================================
export const previewAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate(
      "lecturer",
      "firstName lastName email staffId"
    );
    if (!course) return res.status(404).json({ message: "Course not found" });

    const enrollments = await Enrollment.find({ course: courseId }).populate(
      "student",
      "firstName lastName studentId email"
    );

    const records = await Attendance.find({ course: courseId }).sort({ date: 1 });

    const daySet = new Set();
    records.forEach((r) =>
      daySet.add(new Date(r.date).toISOString().split("T")[0])
    );
    const days = [...daySet].sort();
    const totalDays = days.length;

    const summary = {};
    enrollments.forEach((e) => {
      summary[e.student._id] = {
        student: e.student,
        present: 0,
        late: 0,
        absent: 0,
        total: totalDays,
      };
    });

    records.forEach((r) => {
      const sid = r.student.toString();
      if (summary[sid]) {
        summary[sid][r.status] += 1;
      }
    });

    const students = Object.values(summary).map((s) => {
      const attended = s.present + s.late;
      const percent = s.total
        ? +((attended / s.total) * 100).toFixed(1)
        : 0;
      const marks =
        percent >= 75 ? +((attended / s.total) * 10).toFixed(2) : 0;
      return { ...s, attended, percent, marks };
    });

    res.json({ course, totalDays, days, students, records });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Approve attendance → compute attendanceMarks — LIVE
// ============================================================
export const approveAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.attendanceStatus !== "submitted") {
      return res
        .status(400)
        .json({ message: "Course is not in submitted state" });
    }

    const records = await Attendance.find({ course: courseId });
    const distinctDates = await Attendance.distinct("date", { course: courseId });
    const totalDays = distinctDates.length;

    if (totalDays === 0) {
      return res
        .status(400)
        .json({ message: "No attendance records to approve" });
    }

    const summary = {};
    records.forEach((r) => {
      const sid = r.student.toString();
      if (!summary[sid]) summary[sid] = { present: 0, late: 0, absent: 0 };
      summary[sid][r.status] += 1;
    });

    const settings = await SystemSettings.findOne();
    const grading = settings?.gradingSystem?.length
      ? settings.gradingSystem
      : [
          { min: 80, max: 100, grade: "A", point: 4.0 },
          { min: 75, max: 79, grade: "B+", point: 3.5 },
          { min: 70, max: 74, grade: "B", point: 3.0 },
          { min: 65, max: 69, grade: "C+", point: 2.5 },
          { min: 60, max: 64, grade: "C", point: 2.0 },
          { min: 50, max: 59, grade: "D", point: 1.0 },
          { min: 0, max: 49, grade: "F", point: 0.0 },
        ];

    const updates = [];
    for (const [studentId, s] of Object.entries(summary)) {
      const attended = s.present + s.late;
      const percent = (attended / totalDays) * 100;
      const attendanceMarks =
        percent >= 75 ? +((attended / totalDays) * 10).toFixed(2) : 0;

      let result = await Result.findOne({
        student: studentId,
        course: courseId,
        academicYear: course.academicYear,
        semester: course.semester,
      });

      if (!result) {
        result = new Result({
          student: studentId,
          course: courseId,
          academicYear: course.academicYear,
          semester: course.semester,
          enteredBy: req.user._id,
          status: "pending",
        });
      }

      result.attendanceMarks = attendanceMarks;
      result.totalMarks = calculateTotal({
        attendanceMarks: result.attendanceMarks,
        courseworkMarks: result.courseworkMarks,
        testMarks: result.testMarks,
        examMarks: result.examMarks,
      });
      const g = calculateGrade(result.totalMarks, grading);
      result.grade = g.grade;
      result.gradePoint = g.gradePoint;
      await result.save();
      updates.push(result._id);
    }

    course.attendanceStatus = "approved";
    course.attendanceApprovedAt = new Date();
    course.attendanceRejectedReason = "";
    await course.save();

    // Notify lecturer — LIVE
    if (course.lecturer) {
      await notifyUser({
        recipient: course.lecturer,
        title: `Attendance approved: ${course.code}`,
        message: `Your attendance for ${course.code} has been approved. Marks have been recorded.`,
        type: "general",
        link: "/lecturer/attendance",
      });
    }

    // Live count change to admins
    emitToRole("admin", "attendance:pending-changed", { delta: -1 });

    res.json({
      message: "Attendance approved",
      totalDays,
      studentsUpdated: updates.length,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Reject attendance — LIVE
// ============================================================
export const rejectAttendance = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { reason } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.attendanceStatus !== "submitted") {
      return res
        .status(400)
        .json({ message: "Course is not in submitted state" });
    }

    course.attendanceStatus = "rejected";
    course.attendanceRejectedReason = reason || "Rejected by admin";
    await course.save();

    // Notify lecturer — LIVE
    if (course.lecturer) {
      await notifyUser({
        recipient: course.lecturer,
        title: `Attendance rejected: ${course.code}`,
        message: `Your attendance for ${course.code} was rejected: ${course.attendanceRejectedReason}`,
        type: "general",
        link: "/lecturer/attendance",
      });
    }

    // Live count change to admins
    emitToRole("admin", "attendance:pending-changed", { delta: -1 });

    res.json({ message: "Attendance rejected" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// STUDENT — Own attendance summary
// ============================================================
export const getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate("course", "code name");

    const summary = {};
    records.forEach((r) => {
      const key = r.course?._id?.toString();
      if (!key) return;
      if (!summary[key]) {
        summary[key] = {
          course: r.course,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      summary[key][r.status] += 1;
      summary[key].total += 1;
    });

    const result = Object.values(summary).map((s) => ({
      ...s,
      percentage: s.total
        ? +(((s.present + s.late) / s.total) * 100).toFixed(1)
        : 0,
    }));

    const overall = records.length
      ? +(
          (records.filter((r) => r.status !== "absent").length / records.length) *
          100
        ).toFixed(1)
      : 0;

    res.json({ overall, courses: result, records });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN (legacy) — All attendance records
// ============================================================
export const getAttendance = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.course) filter.course = req.query.course;
    const records = await Attendance.find(filter)
      .populate("student", "firstName lastName studentId")
      .populate("course", "code name");
    res.json(records);
  } catch (err) {
    next(err);
  }
};