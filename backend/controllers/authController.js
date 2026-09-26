import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendEmail } from "../utils/emailService.js";
import { welcomeEmail, passwordResetEmail } from "../utils/emailTemplates.js";

const userResponse = (user, token) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  studentId: user.studentId,
  staffId: user.staffId,
  phone: user.phone,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
  profileImage: user.profileImage,
  address: user.address,
  role: user.role,
  department: user.department,
  program: user.program,
  yearOfStudy: user.yearOfStudy,
  semester: user.semester,
  designation: user.designation,
  officeRoom: user.officeRoom,
  specialization: user.specialization,
  qualifications: user.qualifications,
  joiningDate: user.joiningDate,
  status: user.status,
  token,
});

// ============================================================
// POST /api/auth/register — admin creates STUDENT
// ============================================================
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, gender, dateOfBirth } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const count = await User.countDocuments({ role: "student" });
    const studentId = `STU${String(count + 1).padStart(5, "0")}`;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      studentId,
      role: "student",
    });

    // Send welcome email (fire-and-forget — don't block the response)
    const tpl = welcomeEmail({ firstName, email, password, role: "student" });
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/register-lecturer — admin creates LECTURER
// ============================================================
export const registerLecturer = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      department,
      designation,
      officeRoom,
      specialization,
      joiningDate,
      qualifications,
    } = req.body;

    // ---- Validate joining date ----
    let parsedJoiningDate = null;
    if (joiningDate) {
      parsedJoiningDate = new Date(joiningDate);
      if (isNaN(parsedJoiningDate.getTime())) {
        return res.status(400).json({ message: "Invalid joining date format" });
      }
      const year = parsedJoiningDate.getFullYear();
      if (year < 1950) {
        return res.status(400).json({ message: "Joining year must be 1950 or later" });
      }
      if (parsedJoiningDate > new Date()) {
        return res.status(400).json({ message: "Joining date cannot be in the future" });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const count = await User.countDocuments({ role: "lecturer" });
    const staffId = `LEC${String(count + 1).padStart(5, "0")}`;

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      department,
      designation,
      officeRoom,
      specialization,
      joiningDate: parsedJoiningDate,
      qualifications,
      staffId,
      role: "lecturer",
    });

    // Send welcome email
    const tpl = welcomeEmail({ firstName, email, password, role: "lecturer" });
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch(() => {});

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      staffId: user.staffId,
      role: user.role,
      designation: user.designation,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/login
// ============================================================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
      .select("+password")
      .populate("department", "name code")
      .populate("program", "name code");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active. Contact admin." });
    }
    const token = generateToken(user._id, user.role);
    res.json(userResponse(user, token));
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/auth/me
// ============================================================
export const getMe = async (req, res) => {
  res.json(req.user);
};

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Build reset link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    // Send email
    const tpl = passwordResetEmail({
      firstName: user.firstName,
      resetLink,
    });
    sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
    }).catch(() => {});

    // In dev, also return the token for quick testing
    res.json({
      message: "Reset link sent to your email",
      ...(process.env.NODE_ENV === "development" && { resetToken, resetLink }),
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/reset-password/:token
// ============================================================
export const resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /api/auth/change-password
// ============================================================
export const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};