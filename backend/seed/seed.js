import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import User from "../models/User.js";
import Department from "../models/Department.js";
import Program from "../models/Program.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Result from "../models/Result.js";
import Attendance from "../models/Attendance.js";
import Announcement from "../models/Announcement.js";
import Fee from "../models/Fee.js";
import Timetable from "../models/Timetable.js";
import SystemSettings from "../models/SystemSettings.js";
import Payment from "../models/Payment.js";
import StudentFeeStatus from "../models/StudentFeeStatus.js";
import FeeStructure from "../models/FeeStructure.js";

const run = async () => {
  await connectDB();
  console.log("🌱 Seeding database...");

  await Promise.all([
    User.deleteMany(),
    Department.deleteMany(),
    Program.deleteMany(),
    Course.deleteMany(),
    Enrollment.deleteMany(),
    Result.deleteMany(),
    Attendance.deleteMany(),
    Announcement.deleteMany(),
    Fee.deleteMany(),
    Timetable.deleteMany(),
    SystemSettings.deleteMany(),
    FeeStructure.deleteMany(),
    Payment.deleteMany(),
    StudentFeeStatus.deleteMany(),
  ]);

  // ---- Departments ----
  const departments = await Department.insertMany([
    { name: "Computer Science", code: "CS", description: "CS Department", headOfDepartment: "Dr. Alan Turing" },
    { name: "Information Technology", code: "IT", description: "IT Department", headOfDepartment: "Dr. Grace Hopper" },
    { name: "Business Administration", code: "BA", description: "Business Dept", headOfDepartment: "Dr. Peter Drucker" },
    { name: "Accounting", code: "ACC", description: "Accounting Dept", headOfDepartment: "Dr. Luca Pacioli" },
    { name: "Education", code: "EDU", description: "Education Dept", headOfDepartment: "Dr. Maria Montessori" },
  ]);

  // ---- Programs ----
  const programs = await Program.insertMany([
    { name: "BSc Computer Science", code: "BSC-CS", department: departments[0]._id, duration: 4, degreeType: "Bachelor" },
    { name: "BSc Information Technology", code: "BSC-IT", department: departments[1]._id, duration: 4, degreeType: "Bachelor" },
    { name: "BBA Business Admin", code: "BBA", department: departments[2]._id, duration: 4, degreeType: "Bachelor" },
    { name: "BSc Accounting", code: "BSC-ACC", department: departments[3]._id, duration: 4, degreeType: "Bachelor" },
    { name: "BEd Education", code: "BED", department: departments[4]._id, duration: 4, degreeType: "Bachelor" },
  ]);

  // ---- Admin ----
  const admin = await User.create({
    firstName: "System",
    lastName: "Admin",
    email: "admin@example.com",
    password: "Admin@123",
    role: "admin",
    phone: "+1 555 0001",
    gender: "male",
    status: "active",
  });

  // ---- Students ----
  const studentData = [
    ["Suleiman", "Ahmed", "male", 0, 0, 3, 1],
    ["Aisha", "Bello", "female", 0, 0, 2, 1],
    ["John", "Smith", "male", 1, 1, 1, 2],
    ["Fatima", "Yusuf", "female", 1, 1, 4, 1],
    ["David", "Johnson", "male", 2, 2, 2, 2],
    ["Mary", "Williams", "female", 2, 2, 3, 1],
    ["Ibrahim", "Musa", "male", 3, 3, 1, 2],
    ["Grace", "Okafor", "female", 3, 3, 4, 1],
    ["Peter", "Brown", "male", 4, 4, 2, 1],
    ["Zainab", "Ali", "female", 4, 4, 3, 2],
  ];

  const students = [];
  for (let i = 0; i < studentData.length; i++) {
    const [fn, ln, g, dIdx, pIdx, yr, sem] = studentData[i];
    const s = await User.create({
      firstName: fn,
      lastName: ln,
      gender: g,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.edu`,
      password: "Student@123",
      studentId: `STU${String(i + 1).padStart(5, "0")}`,
      phone: `+1 555 ${String(1000 + i)}`,
      role: "student",
      department: departments[dIdx]._id,
      program: programs[pIdx]._id,
      yearOfStudy: yr,
      semester: sem,
      status: "active",
    });
    students.push(s);
  }

  // ---- Courses ----
  const courseData = [
    ["CS101", "Introduction to Programming", 3, 0, 0, 1],
    ["CS201", "Data Structures", 3, 0, 0, 2],
    ["CS301", "Database Systems", 3, 0, 0, 1],
    ["IT101", "Networking Basics", 3, 1, 1, 1],
    ["IT201", "Web Development", 4, 1, 1, 2],
    ["BA101", "Principles of Management", 3, 2, 2, 1],
    ["BA201", "Marketing", 3, 2, 2, 2],
    ["ACC101", "Financial Accounting", 3, 3, 3, 1],
    ["EDU101", "Educational Psychology", 3, 4, 4, 1],
    ["EDU201", "Curriculum Development", 3, 4, 4, 2],
  ];

  const courses = [];
  for (const [code, name, ch, d, p, s] of courseData) {
    const c = await Course.create({
      code,
      name,
      creditHours: ch,
      department: departments[d]._id,
      program: programs[p]._id,
      semester: s,
      academicYear: "2024/2025",
      status: "active",
    });
    courses.push(c);
  }

  // ---- Enrollments, Results, Attendance, Fees ----
  const grading = [
    { min: 80, max: 100, grade: "A", point: 4.0 },
    { min: 75, max: 79, grade: "B+", point: 3.5 },
    { min: 70, max: 74, grade: "B", point: 3.0 },
    { min: 65, max: 69, grade: "C+", point: 2.5 },
    { min: 60, max: 64, grade: "C", point: 2.0 },
    { min: 50, max: 59, grade: "D", point: 1.0 },
    { min: 0, max: 49, grade: "F", point: 0.0 },
  ];

  // Build batched arrays for fast insert
  const attendanceBatch = [];
  const resultsBatch = [];
  const feesBatch = [];
  const enrollmentsBatch = [];

  for (const student of students) {
    const deptCourses = courses.filter(
      (c) => c.department.toString() === student.department.toString()
    );

    for (const course of deptCourses.slice(0, 3)) {
      enrollmentsBatch.push({
        student: student._id,
        course: course._id,
        semester: course.semester,
        academicYear: "2024/2025",
      });

      const attendanceMarks = Math.floor(Math.random() * 11);   // 0–10
      const courseworkMarks = Math.floor(Math.random() * 11);   // 0–10
      const testMarks = Math.floor(Math.random() * 11);         // 0–10
      const examMarks = 30 + Math.floor(Math.random() * 41);    // 30–70
      const totalMarks = attendanceMarks + courseworkMarks + testMarks + examMarks;

      const g = grading.find((x) => totalMarks >= x.min && totalMarks <= x.max);

      resultsBatch.push({
        student: student._id,
        course: course._id,
        attendanceMarks,
        courseworkMarks,
        testMarks,
        examMarks,
        examLocked: true,
        totalMarks,
        grade: g.grade,
        gradePoint: g.point,
        semester: course.semester,
        academicYear: "2024/2025",
        status: "pending",
        enteredBy: admin._id,
      });

      // Attendance — 20 days per student
      for (let d = 0; d < 20; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        const r = Math.random();
        const status = r < 0.85 ? "present" : r < 0.95 ? "late" : "absent";
        attendanceBatch.push({
          student: student._id,
          course: course._id,
          date,
          status,
        });
      }

      feesBatch.push({
        student: student._id,
        academicYear: "2024/2025",
        semester: course.semester,
        totalFees: 5000,
        amountPaid: Math.random() > 0.5 ? 5000 : 2500,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.5 ? "paid" : "partial",
      });
    }
  }

  // Bulk insert everything (much faster than individual .create() calls)
  console.log("📝 Inserting enrollments...");
  if (enrollmentsBatch.length) {
    await Enrollment.insertMany(enrollmentsBatch, { ordered: false });
  }

  console.log("📝 Inserting results...");
  if (resultsBatch.length) {
    await Result.insertMany(resultsBatch, { ordered: false });
  }

  console.log("📝 Inserting attendance...");
  if (attendanceBatch.length) {
    try {
      await Attendance.insertMany(attendanceBatch, { ordered: false });
    } catch (e) {
      // Ignore duplicate key errors
    }
  }

  console.log("📝 Inserting fees...");
  if (feesBatch.length) {
    await Fee.insertMany(feesBatch, { ordered: false });
  }

  // ---- Timetable ----
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (let i = 0; i < courses.length; i++) {
    await Timetable.create({
      course: courses[i]._id,
      lecturer: null,
      lecturerName: "",
      room: `Room ${100 + i}`,
      day: days[i % 5],
      startTime: `${8 + (i % 4)}:00`,
      endTime: `${9 + (i % 4)}:00`,
      department: courses[i].department,
      program: courses[i].program,
      year: courses[i].semester,
      semester: courses[i].semester,
    });
  }

  // ---- Announcements ----
  await Announcement.insertMany([
    { title: "Welcome to 2024/2025 Academic Year", description: "We are excited to welcome all students back to campus. Please check your timetables and fee status.", author: admin._id, priority: "normal" },
    { title: "Mid-Semester Exams Schedule", description: "Mid-semester examinations will begin in two weeks. Check the notice board for full schedules.", author: admin._id, priority: "important" },
    { title: "Library Extended Hours", description: "The library will remain open until midnight during exam period.", author: admin._id, priority: "normal" },
    { title: "Fee Payment Deadline", description: "All outstanding fees must be paid before end of month to avoid penalties.", author: admin._id, priority: "urgent" },
  ]);

  // ---- System settings ----
  await SystemSettings.create({
    schoolName: "Hope Secondary School",
    email: "info@hopeschool.edu",
    phone: "+255 712 345 678",
    address: "123 School Ave, Dar es Salaam",
    academicYear: "2024/2025",
    currentSemester: 1,
    bankName: "CRDB Bank",
    bankAccountNumber: "0150-1234-5678-90",
    bankAccountName: "Hope Secondary School",
    mobileMoneyNumber: "+255 712 345 678",
    mobileMoneyName: "Hope Secondary School",
    gracePeriodDays: 21,
    semesterStartDates: {
      "2024/2025": {
        "1": new Date("2024-08-15"),
        "2": new Date("2025-01-15"),
      },
    },
  });

  // ---- Default fee structures ($200 first sem, $180 second sem) ----
  const academicYear = "2024/2025";
  for (let year = 1; year <= 4; year++) {
    await FeeStructure.create({
      academicYear,
      year,
      semester: 1,
      amount: 200,
      description: `Year ${year} · Semester 1`,
      dueDate: new Date("2024-08-15"),
    });
    await FeeStructure.create({
      academicYear,
      year,
      semester: 2,
      amount: 180,
      description: `Year ${year} · Semester 2`,
      dueDate: new Date("2025-01-15"),
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("📌 Admin login: admin@example.com / Admin@123");
  console.log("📌 Student login: suleiman.ahmed@student.edu / Student@123");
  console.log("⚠️  CHANGE DEFAULT PASSWORDS BEFORE DEPLOYING TO PRODUCTION!");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});