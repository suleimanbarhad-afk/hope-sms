import FaceData from "../models/FaceData.js";
import Attendance from "../models/Attendance.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

// Euclidean distance between two 128-dim vectors
const euclideanDistance = (a, b) => {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
};

const MATCH_THRESHOLD = 0.6;

// ============================================================
// POST /api/face/enroll
// Student uploads their descriptor once
// Body: { descriptor: [128 numbers] }
// ============================================================
export const enrollFace = async (req, res, next) => {
  try {
    const { descriptor } = req.body;

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res
        .status(400)
        .json({ message: "Descriptor must be an array of 128 numbers" });
    }

    const existing = await FaceData.findOne({ student: req.user._id });

    if (existing) {
      existing.descriptor = descriptor;
      existing.enrolledAt = new Date();
      await existing.save();
      return res.json({ message: "Face re-enrolled successfully" });
    }

    await FaceData.create({
      student: req.user._id,
      descriptor,
    });

    res.status(201).json({ message: "Face enrolled successfully" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/face/status
// Has this student enrolled their face?
// ============================================================
export const getFaceStatus = async (req, res, next) => {
  try {
    const face = await FaceData.findOne({ student: req.user._id });
    res.json({
      enrolled: !!face,
      enrolledAt: face?.enrolledAt || null,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/face/verify-and-mark
// Body: { courseId, descriptor: [128], date }
// Verifies face matches enrolled descriptor + marks attendance
// ============================================================
export const verifyAndMark = async (req, res, next) => {
  try {
    const { courseId, descriptor, date } = req.body;

    if (!courseId || !descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ message: "courseId and descriptor required" });
    }

    // 1. Get enrolled descriptor
    const faceData = await FaceData.findOne({ student: req.user._id });
    if (!faceData) {
      return res.status(400).json({
        message: "You have not enrolled your face yet. Enroll first.",
        code: "NOT_ENROLLED",
      });
    }

    // 2. Compare
    const distance = euclideanDistance(faceData.descriptor, descriptor);
    const matched = distance < MATCH_THRESHOLD;

    if (!matched) {
      return res.status(400).json({
        message: `Face does not match. Distance: ${distance.toFixed(3)}`,
        code: "NO_MATCH",
        distance: +distance.toFixed(3),
      });
    }

    // 3. Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });
    if (!enrollment) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // 4. Verify course has attendance open
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.attendanceOpen) {
      return res
        .status(403)
        .json({ message: "Attendance entry is not open for this course" });
    }

    // 5. Mark or update attendance for today
    const attDate = date ? new Date(date) : new Date();
    const start = new Date(attDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(attDate);
    end.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      student: req.user._id,
      course: courseId,
      date: { $gte: start, $lte: end },
    });

    if (existing) {
      return res.json({
        message: "Attendance already marked for today",
        alreadyMarked: true,
        status: existing.status,
      });
    }

    // Determine present or late based on current time
    const now = new Date();
    const hours = now.getHours();
    const status = hours >= 9 ? "late" : "present";

    const attendance = await Attendance.create({
      student: req.user._id,
      course: courseId,
      date: attDate,
      status,
      markedBy: req.user._id,
      academicYear: course.academicYear,
      semester: course.semester,
    });

    res.status(201).json({
      message: `Attendance marked as ${status}`,
      attendance,
      distance: +distance.toFixed(3),
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/face/students-without-face  (admin)
// For a course, list students who haven't enrolled their face yet
// ============================================================
export const studentsWithoutFace = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ message: "courseId required" });

    const enrollments = await Enrollment.find({ course: courseId }).populate(
      "student",
      "firstName lastName studentId email"
    );

    const studentIds = enrollments.map((e) => e.student._id);
    const enrolledFaces = await FaceData.find({
      student: { $in: studentIds },
    }).select("student");

    const enrolledSet = new Set(
      enrolledFaces.map((f) => f.student.toString())
    );

    const withoutFace = enrollments.filter(
      (e) => !enrolledSet.has(e.student._id.toString())
    );

    res.json({
      total: enrollments.length,
      enrolled: enrolledSet.size,
      withoutFace: withoutFace.length,
      students: withoutFace.map((e) => e.student),
    });
  } catch (err) {
    next(err);
  }
};