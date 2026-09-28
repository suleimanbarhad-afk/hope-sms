import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Payment from "./models/Payment.js";

const run = async () => {
  await connectDB();

  const students = await User.find({ role: "student" }).limit(10);
  console.log(`Found ${students.length} students`);

  const months = [
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
  ];
  const baseAmounts = [450, 520, 380, 620, 710, 850];

  // 1. Create 6 months of payment history per student
  let created = 0;
  for (let m = 0; m < months.length; m++) {
    for (let s = 0; s < students.length; s++) {
      const student = students[s];
      const amount = Math.round(
        baseAmounts[m] + (Math.random() - 0.5) * 200
      );
      const [year, month] = months[m].split("-");
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        15 + s
      );

      await Payment.create({
        student: student._id,
        academicYear: "2024/2025",
        year: student.yearOfStudy || 1,
        semester: 1,
        amount,
        reference: `DEMO-${month}-${s}`,
        paymentDate: date,
        method: "mobile_money",
        status: "approved",
        enteredBy: student._id,
        verifiedBy: student._id,
        verifiedAt: date,
      });
      created++;
    }
  }
  console.log(`✅ Created ${created} demo payments`);

  // 2. Backdate students so we have multi-year enrollment
  const now = new Date();
  for (let i = 0; i < students.length; i++) {
    const backYears = 2 - (i % 3);
    const backDate = new Date(now.getFullYear() - backYears, 0, 1 + i);

    await User.updateOne(
      { _id: students[i]._id },
      { $set: { createdAt: backDate } }
    );
  }
  console.log("✅ Backdated students across 3 years");

  console.log("🎉 Demo analytics data seeded!");
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});