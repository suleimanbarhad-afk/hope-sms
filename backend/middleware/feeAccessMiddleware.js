import StudentFeeStatus from "../models/StudentFeeStatus.js";
import SystemSettings from "../models/SystemSettings.js";
import FeeStructure from "../models/FeeStructure.js";

/**
 * Blocks access for students whose current semester fee is unpaid
 * (after the grace period has passed).
 *
 * Attaches `req.feeAccess = { blocked, reason, status }` so routes can decide.
 */
export const checkSemesterAccess = async (req, res, next) => {
  try {
    // Only applies to students
    if (req.user.role !== "student") return next();

    const settings = await SystemSettings.findOne();
    const academicYear =
      settings?.academicYear || "2024/2025";

    const student = req.user;
    const currentYear = student.yearOfStudy || 1;
    const currentSemester = student.semester || 1;

    // Compute required amount
    const feeStructure = await FeeStructure.findOne({
      academicYear,
      year: currentYear,
      semester: currentSemester,
      status: "active",
    });
    const requiredAmount = feeStructure?.amount || 0;

    // Get cached status
    const status = await StudentFeeStatus.findOne({
      student: student._id,
      academicYear,
      year: currentYear,
      semester: currentSemester,
    });

    // If nothing paid and no status → block after grace period
    const paid = status?.paidAmount || 0;
    const isPaid = requiredAmount === 0 || paid >= requiredAmount;

    if (isPaid) {
      req.feeAccess = { blocked: false, status };
      return next();
    }

    // Grace period check
    const startDate =
      settings?.semesterStartDates?.[academicYear]?.[
        String(currentSemester)
      ] || null;
    const graceDays = settings?.gracePeriodDays || 21;

    if (startDate) {
      const start = new Date(startDate);
      const daysSinceStart = Math.floor(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceStart <= graceDays) {
        req.feeAccess = {
          blocked: false,
          inGracePeriod: true,
          graceDaysLeft: graceDays - daysSinceStart,
          status,
        };
        return next();
      }
    }

    // Block
    req.feeAccess = {
      blocked: true,
      requiredAmount,
      paidAmount: paid,
      balance: paid - requiredAmount,
      status,
    };
    return next();
  } catch (err) {
    next(err);
  }
};

/**
 * Hard block — rejects the request if fee access is blocked.
 * Use on routes where access must be denied.
 */
export const requireFeeAccess = (req, res, next) => {
  if (req.feeAccess?.blocked) {
    return res.status(403).json({
      message:
        "Semester fee is unpaid. Please clear your balance to access this resource.",
      code: "FEE_BLOCKED",
      requiredAmount: req.feeAccess.requiredAmount,
      paidAmount: req.feeAccess.paidAmount,
      balance: req.feeAccess.balance,
    });
  }
  next();
};