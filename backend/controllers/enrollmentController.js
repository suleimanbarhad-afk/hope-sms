import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Notification from "../models/Notification.js";

// ============================================================
// GET /api/enrollments
// Admin: list all enrollments with filters + pagination
// ============================================================
export const listEnrollments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.student) filter.student = req.query.student;
    if (req.query.semester) filter.semester = req.query.semester;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.status) filter.status = req.query.status;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate("student", "firstName lastName studentId email department yearOfStudy")
        .populate({
          path: "course",
          select: "code name creditHours semester academicYear lecturer lecturerName",
          populate: { path: "department", select: "name code" },
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Enrollment.countDocuments(filter),
    ]);

    res.json({
      data: enrollments,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) { next(err); }
};

// ============================================================
// POST /api/enrollments
// Admin: enroll a single student in a course
// Body: { student, course, semester, academicYear }
// ============================================================
export const createEnrollment = async (req, res, next) => {
  try {
    const { student, course, semester, academicYear } = req.body;

    if (!student || !course) {
      return res.status(400).json({ message: "Student and course are required" });
    }

    // Verify student exists and has role student
    const studentDoc = await User.findOne({ _id: student, role: "student" });
    if (!studentDoc) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check for duplicate
    const existing = await Enrollment.findOne({
      student,
      course,
      academicYear: academicYear || courseDoc.academicYear,
      semester: semester || courseDoc.semester,
    });
    if (existing) {
      return res.status(400).json({ message: "Student is already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({
      student,
      course,
      semester: semester || courseDoc.semester,
      academicYear: academicYear || courseDoc.academicYear,
    });

    // Notify student
    await Notification.create({
      recipient: student,
      title: `Enrolled in ${courseDoc.code}`,
      message: `You have been enrolled in ${courseDoc.code} · ${courseDoc.name}.`,
      type: "general",
      link: "/student/courses",
    });

    const populated = await Enrollment.findById(enrollment._id)
      .populate("student", "firstName lastName studentId email")
      .populate("course", "code name creditHours semester academicYear");

    res.status(201).json(populated);
  } catch (err) { next(err); }
};

// ============================================================
// POST /api/enrollments/bulk
// Admin: enroll MANY students in ONE course at once
// Body: { course, studentIds: [...], semester, academicYear }
// ============================================================
export const bulkEnroll = async (req, res, next) => {
  try {
    const { course, studentIds, semester, academicYear } = req.body;

    if (!course || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Course and studentIds are required" });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: "Course not found" });
    }

    const sem = semester || courseDoc.semester;
    const year = academicYear || courseDoc.academicYear;

    // Filter out existing enrollments
    const existing = await Enrollment.find({
      course,
      student: { $in: studentIds },
      semester: sem,
      academicYear: year,
    }).select("student");
    const existingSet = new Set(existing.map((e) => e.student.toString()));

    const toCreate = studentIds
      .filter((id) => !existingSet.has(id.toString()))
      .map((studentId) => ({
        student: studentId,
        course,
        semester: sem,
        academicYear: year,
      }));

    if (toCreate.length === 0) {
      return res.status(200).json({
        message: "All selected students are already enrolled",
        created: 0,
        skipped: studentIds.length,
      });
    }

    const created = await Enrollment.insertMany(toCreate, { ordered: false });

    // Notify all newly-enrolled students
    const notifications = created.map((e) => ({
      recipient: e.student,
      title: `Enrolled in ${courseDoc.code}`,
      message: `You have been enrolled in ${courseDoc.code} · ${courseDoc.name}.`,
      type: "general",
      link: "/student/courses",
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.status(201).json({
      message: `${created.length} student${created.length !== 1 ? "s" : ""} enrolled`,
      created: created.length,
      skipped: studentIds.length - created.length,
    });
  } catch (err) { next(err); }
};

// ============================================================
// DELETE /api/enrollments/:id
// Admin: unenroll a student
// ============================================================
export const deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    await Enrollment.findByIdAndDelete(req.params.id);
    res.json({ message: "Enrollment removed" });
  } catch (err) { next(err); }
};

// ============================================================
// GET /api/enrollments/course/:courseId/students
// Admin: list students enrolled in a specific course
// (useful for the bulk-enroll "unassigned" panel)
// ============================================================
export const listCourseStudents = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate("student", "firstName lastName studentId email yearOfStudy");
    res.json(enrollments);
  } catch (err) { next(err); }
};

// ============================================================
// GET /api/enrollments/available-students/:courseId
// Admin: students NOT yet enrolled in this course
// ============================================================
export const listAvailableStudents = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const enrolledIds = await Enrollment.find({ course: courseId }).distinct("student");

    const students = await User.find({
      role: "student",
      status: "active",
      _id: { $nin: enrolledIds },
    })
      .select("firstName lastName studentId email yearOfStudy department")
      .populate("department", "name code")
      .sort({ firstName: 1 });

    res.json(students);
  } catch (err) { next(err); }
};