import Course from "../models/Course.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

const attachLecturerName = async (data) => {
  if (data.lecturer) {
    const lec = await User.findById(data.lecturer).select("firstName lastName");
    if (lec) {
      data.lecturerName = `${lec.firstName} ${lec.lastName}`;
    }
  } else if (data.lecturer === null || data.lecturer === "") {
    data.lecturer = null;
    data.lecturerName = "";
  }
  return data;
};

export const getCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const filter = {};
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }
    if (req.query.department) filter.department = req.query.department;
    if (req.query.semester) filter.semester = req.query.semester;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("department", "name code")
        .populate("program", "name code")
        .populate("lecturer", "firstName lastName email staffId")
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.json({ data: courses, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("department program")
      .populate("lecturer", "firstName lastName email staffId");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const data = await attachLecturerName({ ...req.body });
    const course = await Course.create(data);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const data = await attachLecturerName({ ...req.body });
    const course = await Course.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: "course",
        populate: [
          { path: "department", select: "name code" },
          { path: "lecturer", select: "firstName lastName email" },
        ],
      });
    res.json(enrollments);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Toggle attendanceOpen / examOpen
// PUT /api/courses/:id/gates
// Body: { attendanceOpen?: bool, examOpen?: bool }
// ============================================================
export const toggleCourseGates = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (typeof req.body.attendanceOpen === "boolean") {
      course.attendanceOpen = req.body.attendanceOpen;
    }
    if (typeof req.body.examOpen === "boolean") {
      course.examOpen = req.body.examOpen;
    }

    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
};