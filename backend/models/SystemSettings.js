import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    schoolName: { type: String, default: "Hope Secondary School" },
    logo: { type: String, default: "" },
    email: { type: String, default: "info@hopeschool.edu" },
    phone: { type: String, default: "+255 712 345 678" },
    address: { type: String, default: "123 School Ave" },

    academicYear: { type: String, default: "2024/2025" },
    currentSemester: { type: Number, default: 1 },

    // ---- School bank account (students pay here) ----
    bankName: { type: String, default: "CRDB Bank" },
    bankAccountNumber: { type: String, default: "" },
    bankAccountName: { type: String, default: "Hope Secondary School" },
    mobileMoneyNumber: { type: String, default: "" },
    mobileMoneyName: { type: String, default: "" },

    // ---- Semester dates + grace period ----
    semesterStartDates: {
      type: Map,
      of: {
        type: Map,
        of: Date,
      },
      default: {},
    },
    // Example: { "2024/2025": { "1": ISODate, "2": ISODate } }
    gracePeriodDays: { type: Number, default: 21 },

    // ---- Grading system ----
    gradingSystem: {
      type: [
        {
          min: Number,
          max: Number,
          grade: String,
          point: Number,
        },
      ],
      default: [
        { min: 80, max: 100, grade: "A", point: 4.0 },
        { min: 75, max: 79, grade: "B+", point: 3.5 },
        { min: 70, max: 74, grade: "B", point: 3.0 },
        { min: 65, max: 69, grade: "C+", point: 2.5 },
        { min: 60, max: 64, grade: "C", point: 2.0 },
        { min: 50, max: 59, grade: "D", point: 1.0 },
        { min: 0, max: 49, grade: "F", point: 0.0 },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", settingsSchema);