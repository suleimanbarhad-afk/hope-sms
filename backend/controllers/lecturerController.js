import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Result from "../models/Result.js";

// ============================================================
// LECTURER-FACING endpoints
// ============================================================

export const getLecturerDashboard = async (req, res, next) => {
  try {
    const lecturerId = req.user._id;

    const courses = await Course.find({ lecturer: lecturerId })
      .populate("department", "name code")
      .populate("program", "name code");

    const courseIds = courses.map((c) => c._id);

    const enrolledStudents = await Enrollment.distinct("student", {
      course: { $in: courseIds },
    });

    const enteredCount = await Result.countDocuments({ enteredBy: lecturerId });
    const pendingCount = await Result.countDocuments({ enteredBy: lecturerId, status: "pending" });
    const approvedCount = await Result.countDocuments({ enteredBy: lecturerId, status: "approved" });
    const rejectedCount = await Result.countDocuments({ enteredBy: lecturerId, status: "rejected" });

    res.json({
      stats: {
        totalCourses: courses.length,
        totalStudents: enrolledStudents.length,
        enteredResults: enteredCount,
        pendingResults: pendingCount,
        approvedResults: approvedCount,
        rejectedResults: rejectedCount,
      },
      courses,
    });
  } catch (err) { next(err); }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturer: req.user._id })
      .populate("department", "name code")
      .populate("program", "name code");

    const enriched = await Promise.all(
      courses.map(async (c) => {
        const studentCount = await Enrollment.countDocuments({ course: c._id });
        return { ...c.toObject(), studentCount };
      })
    );
    res.json(enriched);
  } catch (err) { next(err); }
};

export const getMyStudents = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturer: req.user._id }).select("_id");
    const courseIds = courses.map((c) => c._id);
    if (!courseIds.length) return res.json([]);

    const filter = { course: { $in: courseIds } };
    if (req.query.course) filter.course = req.query.course;

    const enrollments = await Enrollment.find(filter)
      .populate("student", "firstName lastName studentId email phone yearOfStudy semester")
      .populate("course", "code name creditHours");

    res.json(enrollments);
  } catch (err) { next(err); }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("department", "name code")
      .select("-password");
    res.json(user);
  } catch (err) { next(err); }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const allowed = [
      "firstName", "lastName", "phone", "email", "address",
      "profileImage", "officeRoom", "specialization", "qualifications",
    ];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(user);
  } catch (err) { next(err); }
};

// ============================================================
// ADMIN-FACING lecturer management
// ============================================================

// GET /api/lecturers — list, paginated, searchable
export const listLecturers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filter = { role: "lecturer" };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { staffId: { $regex: search, $options: "i" } },
      ];
    }

    const [lecturers, total] = await Promise.all([
      User.find(filter)
        .populate("department", "name code")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      data: lecturers,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) { next(err); }
};

// PUT /api/lecturers/:id/status
export const toggleLecturerStatus = async (req, res, next) => {
  try {
    const lecturer = await User.findOne({ _id: req.params.id, role: "lecturer" });
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });
    lecturer.status = lecturer.status === "active" ? "inactive" : "active";
    await lecturer.save();
    res.json(lecturer);
  } catch (err) { next(err); }
};

// DELETE /api/lecturers/:id
export const deleteLecturer = async (req, res, next) => {
  try {
    const lecturer = await User.findOne({ _id: req.params.id, role: "lecturer" });
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    // Detach from any courses
    await Course.updateMany(
      { lecturer: lecturer._id },
      { $set: { lecturer: null, lecturerName: "" } }
    );

    await User.findByIdAndDelete(lecturer._id);
    res.json({ message: "Lecturer deleted" });
  } catch (err) { next(err); }
};

// GET /api/lecturers/list — simple list for dropdowns
export const listLecturersSimple = async (req, res, next) => {
  try {
    const lecturers = await User.find({ role: "lecturer", status: "active" })
      .select("firstName lastName email staffId designation")
      .sort({ firstName: 1 });
    res.json(lecturers);
  } catch (err) { next(err); }
};