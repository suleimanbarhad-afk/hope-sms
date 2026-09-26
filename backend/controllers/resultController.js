import Result from "../models/Result.js";
import Course from "../models/Course.js";
import SystemSettings from "../models/SystemSettings.js";
import Notification from "../models/Notification.js";
import { calculateGrade, calculateTotal } from "../utils/gradeCalculator.js";
import { sendEmail } from "../utils/emailService.js";
import { resultPublishedEmail } from "../utils/emailTemplates.js";
import { notifyUser } from "../utils/notificationHelper.js";
import { emitToRole } from "../config/socket.js";

const getGrading = async () => {
  const settings = await SystemSettings.findOne();
  return settings?.gradingSystem?.length
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
};

export const getResults = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.course) filter.course = req.query.course;
    if (req.query.status) filter.status = req.query.status;

    const results = await Result.find(filter)
      .populate("student", "firstName lastName studentId")
      .populate({ path: "course", select: "code name creditHours lecturer lecturerName" })
      .populate("enteredBy", "firstName lastName role")
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (err) { next(err); }
};

export const getStudentResults = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const filter = { student: studentId };
    if (req.user.role === "student") filter.status = "approved";

    const results = await Result.find(filter)
      .populate({ path: "course", select: "code name creditHours" })
      .sort({ academicYear: -1, semester: -1 });

    res.json(results);
  } catch (err) { next(err); }
};

export const getMyEnteredResults = async (req, res, next) => {
  try {
    const results = await Result.find({ enteredBy: req.user._id })
      .populate("student", "firstName lastName studentId")
      .populate({ path: "course", select: "code name creditHours examOpen" })
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { next(err); }
};

export const getPendingResults = async (req, res, next) => {
  try {
    const results = await Result.find({ status: "pending" })
      .populate("student", "firstName lastName studentId")
      .populate({ path: "course", select: "code name creditHours" })
      .populate("enteredBy", "firstName lastName role")
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { next(err); }
};

// ============================================================
// CREATE — admin or lecturer
// ============================================================
export const createResult = async (req, res, next) => {
  try {
    const { student, course, courseworkMarks, testMarks, examMarks, semester, academicYear } = req.body;

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "lecturer") {
      if (!courseDoc.lecturer || courseDoc.lecturer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only enter results for your assigned courses" });
      }
    }

    // Exam gate check
    if (examMarks !== undefined && examMarks !== null && examMarks !== 0) {
      if (!courseDoc.examOpen && req.user.role === "lecturer") {
        return res.status(403).json({ message: "Exam entry is not open for this course" });
      }
    }

    const existing = await Result.findOne({ student, course, semester, academicYear });
    if (existing) return res.status(400).json({ message: "Result already exists" });

    const totalMarks = calculateTotal({
      attendanceMarks: 0,
      courseworkMarks,
      testMarks,
      examMarks,
    });
    const grading = await getGrading();
    const { grade, gradePoint } = calculateGrade(totalMarks, grading);

    const result = await Result.create({
      student,
      course,
      attendanceMarks: 0,
      courseworkMarks: courseworkMarks ?? 0,
      testMarks: testMarks ?? 0,
      examMarks: examMarks ?? 0,
      examLocked: examMarks !== undefined && examMarks !== null && examMarks !== 0,
      totalMarks,
      grade,
      gradePoint,
      semester: semester ?? courseDoc.semester,
      academicYear: academicYear ?? courseDoc.academicYear,
      status: "pending",
      enteredBy: req.user._id,
    });

    // Notify admins of new pending result (live)
    emitToRole("admin", "results:pending-changed", { delta: 1 });

    res.status(201).json(result);
  } catch (err) { next(err); }
};

// ============================================================
// UPDATE
// ============================================================
export const updateResult = async (req, res, next) => {
  try {
    const existing = await Result.findById(req.params.id).populate("course");
    if (!existing) return res.status(404).json({ message: "Result not found" });

    if (req.user.role === "lecturer") {
      if (!existing.course?.lecturer || existing.course.lecturer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only edit your own courses' results" });
      }
      if (existing.status === "approved") {
        return res.status(403).json({ message: "Result is approved and locked" });
      }
      if (req.body.examMarks !== undefined && existing.examLocked && req.body.examMarks !== existing.examMarks) {
        return res.status(403).json({ message: "Exam mark is locked" });
      }
      if (req.body.examMarks !== undefined && req.body.examMarks !== 0 && !existing.course.examOpen) {
        return res.status(403).json({ message: "Exam entry is not open for this course" });
      }
      if (req.body.attendanceMarks !== undefined && req.body.attendanceMarks !== existing.attendanceMarks) {
        return res.status(403).json({ message: "Attendance marks are locked to admin approval" });
      }
    }

    const merged = {
      attendanceMarks: req.body.attendanceMarks ?? existing.attendanceMarks,
      courseworkMarks: req.body.courseworkMarks ?? existing.courseworkMarks,
      testMarks: req.body.testMarks ?? existing.testMarks,
      examMarks: req.body.examMarks ?? existing.examMarks,
    };

    const totalMarks = calculateTotal(merged);
    const grading = await getGrading();
    const { grade, gradePoint } = calculateGrade(totalMarks, grading);

    const examLocked =
      existing.examLocked ||
      (req.body.examMarks !== undefined && req.body.examMarks !== null && req.body.examMarks !== 0);

    const update = { ...merged, totalMarks, grade, gradePoint, examLocked };

    if (req.user.role === "lecturer") {
      update.status = "pending";
      update.approvedBy = undefined;
      update.approvedAt = undefined;
      update.rejectionReason = "";
    }

    const updated = await Result.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (err) { next(err); }
};

// ============================================================
// APPROVE — with LIVE notification + email
// ============================================================
export const approveResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });
    if (result.status === "approved") return res.status(400).json({ message: "Already approved" });

    result.status = "approved";
    result.approvedBy = req.user._id;
    result.approvedAt = new Date();
    result.rejectionReason = "";
    await result.save();

    // In-app notification — LIVE push
    await notifyUser({
      recipient: result.student,
      title: "New result published",
      message: "A result has been approved and is now visible in your results page.",
      type: "result",
      link: "/student/results",
    });

    // Live count update for admins
    emitToRole("admin", "results:pending-changed", { delta: -1 });

    // Email notification (best-effort, non-blocking)
    try {
      const populated = await Result.findById(result._id)
        .populate("student", "firstName email")
        .populate("course", "code name");

      if (populated?.student?.email) {
        const tpl = resultPublishedEmail({
          firstName: populated.student.firstName,
          course: populated.course,
          grade: result.grade,
          totalMarks: result.totalMarks,
        });
        sendEmail({
          to: populated.student.email,
          subject: tpl.subject,
          html: tpl.html,
        }).catch(() => {});
      }
    } catch (e) {
      // ignore email errors
    }

    res.json(result);
  } catch (err) { next(err); }
};

// ============================================================
// REJECT — with LIVE notification
// ============================================================
export const rejectResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });

    result.status = "rejected";
    result.approvedBy = req.user._id;
    result.approvedAt = new Date();
    result.rejectionReason = req.body.reason || "Rejected by admin";
    await result.save();

    if (result.enteredBy) {
      await notifyUser({
        recipient: result.enteredBy,
        title: "Result rejected",
        message: `Your result entry was rejected: ${result.rejectionReason}`,
        type: "result",
        link: "/lecturer/results",
      });
    }

    // Live count update for admins
    emitToRole("admin", "results:pending-changed", { delta: -1 });

    res.json(result);
  } catch (err) { next(err); }
};

export const bulkAction = async (req, res, next) => {
  try {
    const { ids, action, reason } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "No results selected" });
    if (!["approve", "reject"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    const update = action === "approve"
      ? { status: "approved", approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: "" }
      : { status: "rejected", approvedBy: req.user._id, approvedAt: new Date(), rejectionReason: reason || "Rejected by admin" };

    const r = await Result.updateMany({ _id: { $in: ids } }, update);

    // Live count update for admins
    emitToRole("admin", "results:pending-changed", { delta: -r.modifiedCount });

    res.json({ message: `${r.modifiedCount} results ${action}d`, count: r.modifiedCount });
  } catch (err) { next(err); }
};

export const deleteResult = async (req, res, next) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: "Result deleted" });
  } catch (err) { next(err); }
};