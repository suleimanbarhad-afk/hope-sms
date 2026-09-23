import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

// Validate phone (7-15 digits, optional leading +)
const validatePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/^\+/, "");
  if (!/^\d+$/.test(cleaned)) return "Phone must contain only digits";
  if (cleaned.length < 7 || cleaned.length > 15)
    return "Phone must be 7–15 digits";
  return null;
};

// @desc Get all students (admin) with pagination + search
export const getStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const { department, program, year, status } = req.query;

    const filter = { role: "student" };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }
    if (department) filter.department = department;
    if (program) filter.program = program;
    if (year) filter.yearOfStudy = year;
    if (status) filter.status = status;

    const [students, total] = await Promise.all([
      User.find(filter)
        .populate("department", "name code")
        .populate("program", "name code")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({ data: students, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id)
      .populate("department", "name code")
      .populate("program", "name code");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const phoneError = validatePhone(req.body.phone);
    if (phoneError) return res.status(400).json({ message: phoneError });

    const count = await User.countDocuments({ role: "student" });
    const studentId =
      req.body.studentId || `STU${String(count + 1).padStart(5, "0")}`;
    const student = await User.create({
      ...req.body,
      studentId,
      role: "student",
    });
    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
};

// Admin-only: change student details (name, email, phone, address)
export const updateStudent = async (req, res, next) => {
  try {
    // Never allow password or role to be mass-updated here
    delete req.body.password;
    delete req.body.role;
    delete req.body.studentId;
    delete req.body.staffId;

    const phoneError = validatePhone(req.body.phone);
    if (phoneError) return res.status(400).json({ message: phoneError });

    const student = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    next(err);
  }
};

export const toggleStudentStatus = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    student.status = student.status === "active" ? "inactive" : "active";
    await student.save();
    res.json(student);
  } catch (err) {
    next(err);
  }
};

export const resetStudentPassword = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    student.password = req.body.newPassword || "Student@123";
    await student.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

// Student self-service: ONLY profile image
export const updateOwnProfile = async (req, res, next) => {
  try {
    const allowed = ["profileImage"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message:
          "Only profile image can be updated. Contact admin to change name, email, phone, or address.",
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};