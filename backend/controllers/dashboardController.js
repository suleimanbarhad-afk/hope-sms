import User from "../models/User.js";
import Course from "../models/Course.js";
import Department from "../models/Department.js";
import Result from "../models/Result.js";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import Fee from "../models/Fee.js";
import Assignment from "../models/Assignment.js";
import Notification from "../models/Notification.js";
import Announcement from "../models/Announcement.js";

// ============================================================
// ADMIN dashboard
// ============================================================
export const adminDashboard = async (req, res, next) => {
  try {
    const [totalStudents, activeStudents, totalCourses, totalDepartments] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", status: "active" }),
      Course.countDocuments(),
      Department.countDocuments(),
    ]);

    const studentsByDept = await User.aggregate([
      { $match: { role: "student", department: { $ne: null } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
      { $unwind: "$dept" },
      { $project: { name: "$dept.name", count: 1, _id: 0 } },
    ]);

    const studentsByYear = await User.aggregate([
      { $match: { role: "student" } },
      { $group: { _id: "$yearOfStudy", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Average GPA from approved results only
    const approvedResults = await Result.find({ status: "approved" });
    const avgGpa = approvedResults.length
      ? +(approvedResults.reduce((a, r) => a + (r.gradePoint || 0), 0) / approvedResults.length).toFixed(2)
      : 0;

    const attendanceRecords = await Attendance.find();
    const attendanceRate = attendanceRecords.length
      ? +((attendanceRecords.filter((a) => a.status !== "absent").length / attendanceRecords.length) * 100).toFixed(1)
      : 0;

    const fees = await Fee.find();
    const outstanding = fees.reduce((a, f) => a + (f.totalFees - f.amountPaid), 0);

    const enrollmentTrends = await Enrollment.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const feeCollection = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: "$totalFees" }, paid: { $sum: "$amountPaid" } } },
    ]);

    const pendingApprovals = await Result.countDocuments({ status: "pending" });

    res.json({
      stats: {
        totalStudents,
        activeStudents,
        totalCourses,
        totalDepartments,
        averageGpa: avgGpa,
        attendanceRate,
        outstandingFees: outstanding,
        pendingApprovals,
      },
      charts: {
        studentsByDept,
        studentsByYear,
        enrollmentTrends: enrollmentTrends.map((e) => ({ year: e._id, count: e.count })),
        feeCollection: feeCollection[0] || { total: 0, paid: 0 },
      },
    });
  } catch (err) { next(err); }
};

// ============================================================
// STUDENT dashboard
// ============================================================
export const studentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const [enrollments, attendance, fees, unreadNotifs, announcements] = await Promise.all([
      Enrollment.find({ student: studentId })
        .populate("course", "code name creditHours lecturer lecturerName"),
      Attendance.find({ student: studentId }),
      Fee.find({ student: studentId }),
      Notification.countDocuments({ recipient: studentId, read: false }),
      Announcement.find({ published: true }).sort({ createdAt: -1 }).limit(4),
    ]);

    // Recent approved results only
    const recentResults = await Result.find({ student: studentId, status: "approved" })
      .populate({ path: "course", select: "code name creditHours" })
      .sort({ createdAt: -1 })
      .limit(5);

    // GPA from approved results
    const approvedResults = await Result.find({
      student: studentId,
      status: "approved",
    }).populate("course", "creditHours");

    let totalPoints = 0;
    let totalCredits = 0;
    approvedResults.forEach((r) => {
      const c = r.course?.creditHours || 0;
      totalPoints += (r.gradePoint || 0) * c;
      totalCredits += c;
    });
    const gpa = totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0;

    const attendancePercent = attendance.length
      ? +((attendance.filter((a) => a.status !== "absent").length / attendance.length) * 100).toFixed(1)
      : 0;

    const outstandingFees = fees.reduce((a, f) => a + (f.totalFees - f.amountPaid), 0);

    const assignments = await Assignment.countDocuments();

    res.json({
      stats: {
        gpa,
        totalCredits,
        registeredCourses: enrollments.length,
        attendancePercent,
        pendingAssignments: assignments,
        unreadNotifications: unreadNotifs,
        outstandingFees,
      },
      recentResults,
      announcements,
      enrolledCourses: enrollments.slice(0, 5),
    });
  } catch (err) { next(err); }
};