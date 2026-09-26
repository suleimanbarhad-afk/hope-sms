import User from "../models/User.js";
import Course from "../models/Course.js";
import Result from "../models/Result.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";
import StudentFeeStatus from "../models/StudentFeeStatus.js";
import Announcement from "../models/Announcement.js";
import SystemSettings from "../models/SystemSettings.js";
import Payment from "../models/Payment.js";

const calcGPA = async (studentId) => {
  const results = await Result.find({
    student: studentId,
    status: "approved",
  }).populate("course", "creditHours");

  let points = 0;
  let credits = 0;
  results.forEach((r) => {
    const c = r.course?.creditHours || 0;
    points += (r.gradePoint || 0) * c;
    credits += c;
  });

  return {
    gpa: credits ? +(points / credits).toFixed(2) : 0,
    totalCredits: credits,
    courseCount: results.length,
  };
};

// ============================================================
// STUDENT CONTEXT
// ============================================================
const buildStudentContext = async (userId) => {
  const student = await User.findById(userId)
    .populate("department", "name code")
    .populate("program", "name code");

  if (!student) return "Student not found.";

  const [enrollments, results, attendance, fees, announcements] =
    await Promise.all([
      Enrollment.find({ student: userId })
        .populate("course", "code name creditHours semester")
        .limit(20),
      Result.find({ student: userId, status: "approved" })
        .populate("course", "code name creditHours")
        .sort({ createdAt: -1 })
        .limit(20),
      Attendance.find({ student: userId })
        .populate("course", "code name")
        .limit(300),
      StudentFeeStatus.find({ student: userId })
        .sort({ year: -1, semester: -1 })
        .limit(5),
      Announcement.find({ published: true })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  const gpaInfo = await calcGPA(userId);

  const attendanceByCourse = {};
  attendance.forEach((a) => {
    const key = a.course?.code || "Unknown";
    if (!attendanceByCourse[key]) {
      attendanceByCourse[key] = { present: 0, late: 0, absent: 0, total: 0 };
    }
    attendanceByCourse[key][a.status] += 1;
    attendanceByCourse[key].total += 1;
  });

  const attendanceSummary = Object.entries(attendanceByCourse).map(
    ([course, s]) => ({
      course,
      present: s.present,
      late: s.late,
      absent: s.absent,
      percent: s.total
        ? +(((s.present + s.late) / s.total) * 100).toFixed(1)
        : 0,
    })
  );

  const feeSummary = fees.map((f) => ({
    year: f.year,
    semester: f.semester,
    required: f.requiredAmount,
    paid: f.paidAmount,
    balance: f.balance,
    status: f.status,
  }));

  return `
=== STUDENT PROFILE ===
Name: ${student.firstName} ${student.lastName}
Student ID: ${student.studentId}
Email: ${student.email}
Department: ${student.department?.name || "—"}
Program: ${student.program?.name || "—"}
Year: ${student.yearOfStudy || "—"}
Semester: ${student.semester || "—"}

=== ACADEMIC PERFORMANCE ===
GPA: ${gpaInfo.gpa} (out of 4.0)
Total Credits: ${gpaInfo.totalCredits}
Approved Results: ${gpaInfo.courseCount}

Recent Results:
${
  results
    .slice(0, 10)
    .map(
      (r) =>
        `- ${r.course?.code} ${r.course?.name}: Total ${r.totalMarks}/100, Grade ${r.grade}`
    )
    .join("\n") || "No results yet."
}

=== ENROLLED COURSES (${enrollments.length}) ===
${
  enrollments
    .map(
      (e) =>
        `- ${e.course?.code} ${e.course?.name} (${e.course?.creditHours} credits, Sem ${e.course?.semester})`
    )
    .join("\n") || "No enrollments."
}

=== ATTENDANCE ===
${
  attendanceSummary
    .map(
      (a) =>
        `- ${a.course}: ${a.percent}% (${a.present}P / ${a.late}L / ${a.absent}A out of ${a.present + a.late + a.absent})`
    )
    .join("\n") || "No attendance records."
}

=== FEES ===
${
  feeSummary
    .map(
      (f) =>
        `- Year ${f.year} Sem ${f.semester}: Required $${f.required}, Paid $${f.paid}, Balance $${f.balance}, Status: ${f.status}`
    )
    .join("\n") || "No fee records."
}

=== RECENT ANNOUNCEMENTS ===
${
  announcements
    .map((a) => `- ${a.title}: ${a.description?.slice(0, 100) || ""}`)
    .join("\n") || "None."
}
`;
};

// ============================================================
// LECTURER CONTEXT
// ============================================================
const buildLecturerContext = async (userId) => {
  const lecturer = await User.findById(userId).populate(
    "department",
    "name code"
  );

  if (!lecturer) return "Lecturer not found.";

  const courses = await Course.find({ lecturer: userId });

  const enrolledCounts = await Promise.all(
    courses.map(async (c) => ({
      code: c.code,
      name: c.name,
      students: await Enrollment.countDocuments({ course: c._id }),
      creditHours: c.creditHours,
    }))
  );

  return `
=== LECTURER PROFILE ===
Name: ${lecturer.firstName} ${lecturer.lastName}
Staff ID: ${lecturer.staffId}
Email: ${lecturer.email}
Designation: ${lecturer.designation || "Lecturer"}
Department: ${lecturer.department?.name || "—"}

=== MY COURSES (${courses.length}) ===
${
  enrolledCounts
    .map(
      (c) =>
        `- ${c.code} ${c.name}: ${c.students} students, ${c.creditHours} credits`
    )
    .join("\n") || "No courses assigned."
}
`;
};

// ============================================================
// ADMIN CONTEXT
// ============================================================
const buildAdminContext = async () => {
  const [
    totalStudents,
    totalLecturers,
    totalCourses,
    totalEnrollments,
    pendingPayments,
    pendingResults,
    pendingAttendance,
    settings,
    topStudents,
    feeStats,
  ] = await Promise.all([
    User.countDocuments({ role: "student", status: "active" }),
    User.countDocuments({ role: "lecturer", status: "active" }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Payment.countDocuments({ status: "pending" }),
    Result.countDocuments({ status: "pending" }),
    Course.countDocuments({ attendanceStatus: "submitted" }),
    SystemSettings.findOne(),
    Result.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$student",
          avgPoint: { $avg: "$gradePoint" },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgPoint: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ]),
    StudentFeeStatus.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const feeStatusSummary = feeStats
    .map((f) => `- ${f._id}: ${f.count} students`)
    .join("\n");

  return `
=== SCHOOL OVERVIEW ===
School: ${settings?.schoolName || "Hope Secondary School"}
Academic Year: ${settings?.academicYear || "2024/2025"}

=== TOTALS ===
Active Students: ${totalStudents}
Active Lecturers: ${totalLecturers}
Total Courses: ${totalCourses}
Total Enrollments: ${totalEnrollments}

=== PENDING ACTIONS ===
Pending Payments: ${pendingPayments}
Pending Results: ${pendingResults}
Pending Attendance Approvals: ${pendingAttendance}

=== FEE STATUS BREAKDOWN ===
${feeStatusSummary || "No fee data."}

=== TOP PERFORMING STUDENTS ===
${
  topStudents
    .map(
      (s) =>
        `- ${s.student.firstName} ${s.student.lastName} (${s.student.studentId}): Avg GPA Point ${s.avgPoint.toFixed(2)}, ${s.count} courses`
    )
    .join("\n") || "No data."
}
`;
};

// ============================================================
// MAIN — dispatch by role
// ============================================================
export const buildRAGContext = async (user) => {
  try {
    if (user.role === "student") return await buildStudentContext(user._id);
    if (user.role === "lecturer") return await buildLecturerContext(user._id);
    if (user.role === "admin") return await buildAdminContext();
    return "Unknown user role.";
  } catch (err) {
    console.error("buildRAGContext error:", err.message);
    return "Unable to load context.";
  }
};