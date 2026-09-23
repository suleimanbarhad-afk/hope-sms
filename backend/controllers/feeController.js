import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";

export const getFees = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    const fees = await Fee.find(filter).populate("student", "firstName lastName studentId");
    res.json(fees);
  } catch (err) { next(err); }
};

export const getMyFees = async (req, res, next) => {
  try {
    const fees = await Fee.find({ student: req.user._id }).sort({ academicYear: -1, semester: -1 });
    const payments = await Payment.find({ student: req.user._id }).sort({ paymentDate: -1 });
    res.json({ fees, payments });
  } catch (err) { next(err); }
};

export const createFee = async (req, res, next) => {
  try {
    const fee = await Fee.create(req.body);
    res.status(201).json(fee);
  } catch (err) { next(err); }
};

export const updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found" });
    Object.assign(fee, req.body);
    if (req.body.amountPaid !== undefined) {
      fee.status = fee.amountPaid >= fee.totalFees ? "paid" : fee.amountPaid > 0 ? "partial" : "unpaid";
    }
    await fee.save();
    res.json(fee);
  } catch (err) { next(err); }
};

export const recordPayment = async (req, res, next) => {
  try {
    const { student, feeId, amount, reference, method } = req.body;
    const payment = await Payment.create({ student, fee: feeId, amount, reference, method });
    const fee = await Fee.findById(feeId);
    if (fee) {
      fee.amountPaid += amount;
      fee.status = fee.amountPaid >= fee.totalFees ? "paid" : fee.amountPaid > 0 ? "partial" : "unpaid";
      await fee.save();
    }
    res.status(201).json(payment);
  } catch (err) { next(err); }
};