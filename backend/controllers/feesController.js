import Payment from "../models/Payment.js";
import StudentFeeStatus from "../models/StudentFeeStatus.js";
import FeeStructure from "../models/FeeStructure.js";
import SystemSettings from "../models/SystemSettings.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/emailService.js";
import { paymentVerifiedEmail } from "../utils/emailTemplates.js";
import { notifyUser } from "../utils/notificationHelper.js";
import { emitToRole } from "../config/socket.js";

// ============================================================
// Helper — recompute a student's fee status for one semester
// ============================================================
const recomputeStudentFeeStatus = async (
  studentId,
  academicYear,
  year,
  semester
) => {
  const feeStructure = await FeeStructure.findOne({
    academicYear,
    year,
    semester,
    status: "active",
  });
  const requiredAmount = feeStructure?.amount || 0;

  const payments = await Payment.find({
    student: studentId,
    academicYear,
    year,
    semester,
  });

  const approved = payments
    .filter((p) => p.status === "approved")
    .reduce((a, p) => a + p.amount, 0);

  const pending = payments
    .filter((p) => p.status === "pending")
    .reduce((a, p) => a + p.amount, 0);

  const balance = approved - requiredAmount;

  let status = "unpaid";
  if (approved >= requiredAmount && requiredAmount > 0) {
    status = balance > 0 ? "credit" : "paid";
  } else if (approved > 0) {
    status = "partial";
  }

  const doc = await StudentFeeStatus.findOneAndUpdate(
    { student: studentId, academicYear, year, semester },
    {
      student: studentId,
      academicYear,
      year,
      semester,
      requiredAmount,
      paidAmount: approved,
      pendingAmount: pending,
      balance,
      status,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );

  return doc;
};

// ============================================================
// STUDENT — Get own fee status
// GET /api/fees/my
// ============================================================
export const getMyFees = async (req, res, next) => {
  try {
    const student = req.user;
    const settings = await SystemSettings.findOne();
    const academicYear =
      settings?.academicYear || student.academicYear || "2024/2025";

    const currentYear = student.yearOfStudy || 1;
    const currentSemester = student.semester || 1;

    const current = await recomputeStudentFeeStatus(
      student._id,
      academicYear,
      currentYear,
      currentSemester
    );

    const payments = await Payment.find({ student: student._id }).sort({
      paymentDate: -1,
    });

    const allStatuses = await StudentFeeStatus.find({
      student: student._id,
    }).sort({ academicYear: -1, year: 1, semester: 1 });

    const feeStructure = await FeeStructure.findOne({
      academicYear,
      year: currentYear,
      semester: currentSemester,
    });

    res.json({
      current: {
        academicYear,
        year: currentYear,
        semester: currentSemester,
        requiredAmount: current.requiredAmount,
        paidAmount: current.paidAmount,
        pendingAmount: current.pendingAmount,
        balance: current.balance,
        status: current.status,
        dueDate: feeStructure?.dueDate,
      },
      bankInfo: {
        schoolName: settings?.schoolName || "Hope Secondary School",
        bankName: settings?.bankName || "",
        bankAccountNumber: settings?.bankAccountNumber || "",
        bankAccountName: settings?.bankAccountName || "",
        mobileMoneyNumber: settings?.mobileMoneyNumber || "",
        mobileMoneyName: settings?.mobileMoneyName || "",
      },
      gracePeriodDays: settings?.gracePeriodDays || 21,
      semesterStartDate:
        settings?.semesterStartDates?.[academicYear]?.[
          String(currentSemester)
        ] || null,
      payments,
      allStatuses,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// STUDENT — Record a new payment
// POST /api/fees/my/payment
// ============================================================
export const createMyPayment = async (req, res, next) => {
  try {
    const student = req.user;
    const settings = await SystemSettings.findOne();
    const academicYear =
      settings?.academicYear || student.academicYear || "2024/2025";

    const { amount, reference, paymentDate, method, notes, receiptImage } =
      req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive" });
    }
    if (!reference) {
      return res.status(400).json({ message: "Transaction reference required" });
    }

    const payment = await Payment.create({
      student: student._id,
      academicYear,
      year: student.yearOfStudy || 1,
      semester: student.semester || 1,
      amount: Number(amount),
      reference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      method: method || "mobile_money",
      receiptImage: receiptImage || "",
      notes: notes || "",
      status: "pending",
      enteredBy: student._id,
    });

    await recomputeStudentFeeStatus(
      student._id,
      academicYear,
      student.yearOfStudy || 1,
      student.semester || 1
    );

    // Notify admins — LIVE
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const a of admins) {
      await notifyUser({
        recipient: a._id,
        title: `Payment awaiting verification`,
        message: `${student.firstName} ${student.lastName} submitted a $${amount} payment (${reference}).`,
        type: "fee",
        link: "/admin/fees",
      });
    }

    // Live count change to admins
    emitToRole("admin", "fees:pending-changed", { delta: 1 });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — List all payments
// GET /api/fees/payments
// ============================================================
export const listPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.semester) filter.semester = req.query.semester;

    if (req.query.search) {
      const students = await User.find({
        role: "student",
        $or: [
          { firstName: { $regex: req.query.search, $options: "i" } },
          { lastName: { $regex: req.query.search, $options: "i" } },
          { studentId: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }).select("_id");
      filter.student = { $in: students.map((s) => s._id) };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("student", "firstName lastName studentId email")
        .populate("verifiedBy", "firstName lastName")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Payment.countDocuments(filter),
    ]);

    res.json({
      data: payments,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Approve a payment — LIVE
// PUT /api/fees/payments/:id/approve
// ============================================================
export const approvePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    payment.status = "approved";
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.rejectionReason = "";
    await payment.save();

    await recomputeStudentFeeStatus(
      payment.student,
      payment.academicYear,
      payment.year,
      payment.semester
    );

    // In-app notification — LIVE
    await notifyUser({
      recipient: payment.student,
      title: "Payment verified",
      message: `Your payment of $${payment.amount} (${payment.reference}) has been approved.`,
      type: "fee",
      link: "/student/fees",
    });

    // Live count change to admins
    emitToRole("admin", "fees:pending-changed", { delta: -1 });

    // Send email (best-effort)
    try {
      const populated = await Payment.findById(payment._id).populate(
        "student",
        "firstName email"
      );
      if (populated?.student?.email) {
        const tpl = paymentVerifiedEmail({
          firstName: populated.student.firstName,
          amount: payment.amount,
          reference: payment.reference,
        });
        sendEmail({
          to: populated.student.email,
          subject: tpl.subject,
          html: tpl.html,
        }).catch(() => {});
      }
    } catch (e) {
      // ignore email errors
    }

    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Reject a payment — LIVE
// PUT /api/fees/payments/:id/reject
// ============================================================
export const rejectPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "rejected";
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();
    payment.rejectionReason = req.body.reason || "Rejected by admin";
    await payment.save();

    await recomputeStudentFeeStatus(
      payment.student,
      payment.academicYear,
      payment.year,
      payment.semester
    );

    // In-app notification — LIVE
    await notifyUser({
      recipient: payment.student,
      title: "Payment rejected",
      message: `Your payment of $${payment.amount} was rejected: ${payment.rejectionReason}`,
      type: "fee",
      link: "/student/fees",
    });

    // Live count change to admins
    emitToRole("admin", "fees:pending-changed", { delta: -1 });

    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Record payment on behalf — LIVE
// POST /api/fees/payments/admin
// ============================================================
export const adminCreatePayment = async (req, res, next) => {
  try {
    const {
      student,
      amount,
      reference,
      paymentDate,
      method,
      notes,
      academicYear,
      year,
      semester,
    } = req.body;

    if (!student || !amount || !reference) {
      return res
        .status(400)
        .json({ message: "student, amount, reference required" });
    }

    const studentDoc = await User.findOne({ _id: student, role: "student" });
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    const settings = await SystemSettings.findOne();
    const ay = academicYear || settings?.academicYear || "2024/2025";
    const y = year || studentDoc.yearOfStudy || 1;
    const s = semester || studentDoc.semester || 1;

    const payment = await Payment.create({
      student,
      academicYear: ay,
      year: y,
      semester: s,
      amount: Number(amount),
      reference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      method: method || "cash",
      notes: notes || "",
      status: "approved",
      enteredBy: req.user._id,
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    });

    await recomputeStudentFeeStatus(student, ay, y, s);

    // In-app notification — LIVE
    await notifyUser({
      recipient: student,
      title: "Payment recorded by admin",
      message: `A payment of $${amount} was recorded for you by an administrator.`,
      type: "fee",
      link: "/student/fees",
    });

    // Send email (best-effort)
    if (studentDoc.email) {
      const tpl = paymentVerifiedEmail({
        firstName: studentDoc.firstName,
        amount: Number(amount),
        reference,
      });
      sendEmail({
        to: studentDoc.email,
        subject: tpl.subject,
        html: tpl.html,
      }).catch(() => {});
    }

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — All student fee statuses
// GET /api/fees/statuses
// ============================================================
export const listStudentFeeStatuses = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne();
    const academicYear =
      req.query.academicYear || settings?.academicYear || "2024/2025";
    const year = Number(req.query.year) || null;
    const semester = Number(req.query.semester) || null;

    const students = await User.find({
      role: "student",
      status: "active",
    }).select("firstName lastName studentId email yearOfStudy semester");

    const results = [];
    for (const s of students) {
      const y = year || s.yearOfStudy || 1;
      const sem = semester || s.semester || 1;

      const status = await recomputeStudentFeeStatus(
        s._id,
        academicYear,
        y,
        sem
      );

      results.push({
        student: s,
        academicYear,
        year: y,
        semester: sem,
        requiredAmount: status.requiredAmount,
        paidAmount: status.paidAmount,
        pendingAmount: status.pendingAmount,
        balance: status.balance,
        status: status.status,
      });
    }

    const filter = req.query.filter || "all";
    let filtered = results;
    if (filter === "owes") filtered = results.filter((r) => r.balance < 0);
    else if (filter === "paid") filtered = results.filter((r) => r.status === "paid");
    else if (filter === "credit") filtered = results.filter((r) => r.status === "credit");
    else if (filter === "pending") filtered = results.filter((r) => r.pendingAmount > 0);
    else if (filter === "unpaid") filtered = results.filter((r) => r.status === "unpaid");

    const summary = {
      total: results.length,
      owes: results.filter((r) => r.balance < 0).length,
      paidUp: results.filter((r) => r.status === "paid").length,
      credit: results.filter((r) => r.status === "credit").length,
      unpaid: results.filter((r) => r.status === "unpaid").length,
      totalRequired: results.reduce((a, r) => a + r.requiredAmount, 0),
      totalCollected: results.reduce((a, r) => a + r.paidAmount, 0),
      totalOutstanding: results.reduce((a, r) => a + Math.max(0, -r.balance), 0),
    };

    res.json({ data: filtered, summary });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN — Quick stats
// GET /api/fees/stats
// ============================================================
export const getFeeStats = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne();
    const academicYear =
      req.query.academicYear || settings?.academicYear || "2024/2025";

    const pendingCount = await Payment.countDocuments({ status: "pending" });
    const approvedAgg = await Payment.aggregate([
      { $match: { status: "approved", academicYear } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingAgg = await Payment.aggregate([
      { $match: { status: "pending", academicYear } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      pendingVerifications: pendingCount,
      totalCollected: approvedAgg[0]?.total || 0,
      pendingAmount: pendingAgg[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// SYSTEM SETTINGS
// ============================================================
export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      "schoolName", "email", "phone", "address",
      "academicYear", "currentSemester",
      "bankName", "bankAccountNumber", "bankAccountName",
      "mobileMoneyNumber", "mobileMoneyName",
      "gracePeriodDays", "logo",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    if (req.body.semesterStartDates) {
      updates.semesterStartDates = req.body.semesterStartDates;
    }

    const settings = await SystemSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
};