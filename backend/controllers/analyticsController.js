import User from "../models/User.js";
import Result from "../models/Result.js";
import Attendance from "../models/Attendance.js";
import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";
import StudentFeeStatus from "../models/StudentFeeStatus.js";
import Enrollment from "../models/Enrollment.js";
import {
  computeRiskScore,
  riskCategory,
  predictGPA,
  forecastFees,
  forecastEnrollment,
  clusterStudents,
} from "../services/mlService.js";

// ============================================================
// GET /api/analytics/at-risk
// Returns list of students with risk scores
// ============================================================
export const getAtRiskStudents = async (req, res, next) => {
  try {
    const students = await User.find({
      role: "student",
      status: "active",
    }).select("firstName lastName studentId email yearOfStudy semester");

    const results = [];

    for (const s of students) {
      // Attendance %
      const attendance = await Attendance.find({ student: s._id });
      const attendancePercent = attendance.length
        ? +(
            (attendance.filter((a) => a.status !== "absent").length /
              attendance.length) *
            100
          ).toFixed(1)
        : 100;

      // Avg marks + failed courses
      const studentResults = await Result.find({
        student: s._id,
        status: "approved",
      });
      const avgMarks = studentResults.length
        ? +(
            studentResults.reduce((a, r) => a + (r.totalMarks || 0), 0) /
            studentResults.length
          ).toFixed(1)
        : 100;
      const failedCourses = studentResults.filter(
        (r) => (r.gradePoint || 0) === 0
      ).length;

      // Pending fees
      const feeStatus = await StudentFeeStatus.findOne({
        student: s._id,
      });
      const pendingFees = feeStatus?.balance < 0 ? -feeStatus.balance : 0;

      // GPA trend (compare first half vs second half of results)
      let gpaTrend = 0;
      if (studentResults.length >= 2) {
        const sorted = [...studentResults].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const half = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, half);
        const secondHalf = sorted.slice(half);
        const avgFirst =
          firstHalf.reduce((a, r) => a + (r.gradePoint || 0), 0) /
          firstHalf.length;
        const avgSecond =
          secondHalf.reduce((a, r) => a + (r.gradePoint || 0), 0) /
          secondHalf.length;
        gpaTrend = +(avgSecond - avgFirst).toFixed(2);
      }

      const riskScore = computeRiskScore({
        attendancePercent,
        avgMarks,
        pendingFees,
        gpaTrend,
        failedCourses,
      });

      results.push({
        student: {
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          email: s.email,
          year: s.yearOfStudy,
          semester: s.semester,
        },
        metrics: {
          attendancePercent,
          avgMarks,
          failedCourses,
          pendingFees,
          gpaTrend,
        },
        riskScore,
        riskCategory: riskCategory(riskScore),
      });
    }

    // Sort by risk (highest first)
    results.sort((a, b) => b.riskScore - a.riskScore);

    const summary = {
      total: results.length,
      high: results.filter((r) => r.riskCategory === "high").length,
      medium: results.filter((r) => r.riskCategory === "medium").length,
      low: results.filter((r) => r.riskCategory === "low").length,
      safe: results.filter((r) => r.riskCategory === "safe").length,
    };

    res.json({ data: results, summary });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/analytics/gpa-trajectory/:studentId
// Predict a student's next GPA
// ============================================================
export const getGPATrajectory = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const results = await Result.find({
      student: studentId,
      status: "approved",
    }).sort({ createdAt: 1 });

    // Group by semester
    const bySemester = {};
    results.forEach((r) => {
      const key = `${r.academicYear}-S${r.semester}`;
      if (!bySemester[key]) bySemester[key] = [];
      bySemester[key].push(r.gradePoint || 0);
    });

    const history = Object.entries(bySemester)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, points], i) => ({
        semester: i + 1,
        label: key,
        gpa: +(points.reduce((a, b) => a + b, 0) / points.length).toFixed(2),
      }));

    const prediction = predictGPA(history);

    res.json({
      studentId,
      history,
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/analytics/fee-forecast
// Predict next month's fee collection
// ============================================================
export const getFeeForecast = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: "approved" }).sort({
      paymentDate: 1,
    });

    // Group by month
    const byMonth = {};
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + p.amount;
    });

    const monthlyData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, collected]) => ({ month, collected }));

    const forecast = forecastFees(monthlyData);

    res.json(forecast);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/analytics/enrollment-forecast
// Predict next year's intake
// ============================================================
export const getEnrollmentForecast = async (req, res, next) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "createdAt"
    );

    const byYear = {};
    students.forEach((s) => {
      const y = new Date(s.createdAt).getFullYear();
      byYear[y] = (byYear[y] || 0) + 1;
    });

    const yearlyData = Object.entries(byYear)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));

    const forecast = forecastEnrollment(yearlyData);

    res.json(forecast);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/analytics/performance-tiers
// Cluster all students into tiers
// ============================================================
export const getPerformanceTiers = async (req, res, next) => {
  try {
    const students = await User.find({
      role: "student",
      status: "active",
    }).select("firstName lastName studentId yearOfStudy");

    const enriched = [];

    for (const s of students) {
      const results = await Result.find({
        student: s._id,
        status: "approved",
      });
      const attendance = await Attendance.find({ student: s._id });

      let gpa = 0;
      let avgMarks = 0;
      if (results.length) {
        let points = 0;
        let credits = 0;
        let totalMarks = 0;
        results.forEach((r) => {
          points += (r.gradePoint || 0) * 3; // assume 3 credits
          credits += 3;
          totalMarks += r.totalMarks || 0;
        });
        gpa = credits ? +(points / credits).toFixed(2) : 0;
        avgMarks = +(totalMarks / results.length).toFixed(1);
      }

      const attendancePercent = attendance.length
        ? +(
            (attendance.filter((a) => a.status !== "absent").length /
              attendance.length) *
            100
          ).toFixed(1)
        : 100;

      enriched.push({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        studentId: s.studentId,
        gpa,
        attendance: attendancePercent,
        avgMarks,
      });
    }

    const clustered = clusterStudents(enriched);

    const tiers = {
      excellent: clustered.filter((s) => s.tier === "excellent"),
      good: clustered.filter((s) => s.tier === "good"),
      average: clustered.filter((s) => s.tier === "average"),
      "below-average": clustered.filter((s) => s.tier === "below-average"),
      "at-risk": clustered.filter((s) => s.tier === "at-risk"),
    };

    res.json({
      tiers,
      summary: {
        excellent: tiers.excellent.length,
        good: tiers.good.length,
        average: tiers.average.length,
        belowAverage: tiers["below-average"].length,
        atRisk: tiers["at-risk"].length,
        total: clustered.length,
      },
    });
  } catch (err) {
    next(err);
  }
};