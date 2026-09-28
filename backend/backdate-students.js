import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";

const run = async () => {
  await connectDB();

  const students = await User.find({ role: "student" });

  if (!students.length) {
    console.log("No students found.");
    process.exit(0);
  }

  // Spread students across 2024, 2025, 2026
  const years = [2024, 2025, 2026];

  for (let i = 0; i < students.length; i++) {
    const year = years[i % 3];
    const month = i % 12;
    const day = 1 + (i % 28);
    const date = new Date(year, month, day);

    // Use raw MongoDB collection to bypass Mongoose timestamps
    await User.collection.updateOne(
      { _id: students[i]._id },
      { $set: { createdAt: date } }
    );
  }

  console.log(`✅ Backdated ${students.length} students across 3 years`);

  // Verify
  const updated = await User.find({ role: "student" }).select(
    "firstName createdAt"
  );
  updated.forEach((s) =>
    console.log(
      `  ${s.firstName}: ${s.createdAt.toISOString().split("T")[0]}`
    )
  );

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});