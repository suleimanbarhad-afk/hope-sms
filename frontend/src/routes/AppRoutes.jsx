import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../pages/Landing";
import Notifications from "../pages/Notifications";
import Login from "../pages/auth/Login";
import LiveVideo from "../pages/LiveVideo";
import LiveClasses from "../pages/student/LiveClasses";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import StudentLayout from "../layouts/StudentLayout";
import AdminLayout from "../layouts/AdminLayout";
import LecturerLayout from "../layouts/LecturerLayout";

// Student
import StudentDashboard from "../pages/student/Dashboard";
import StudentProfile from "../pages/student/Profile";
import StudentCourses from "../pages/student/Courses";
import StudentResults from "../pages/student/Results";
import StudentAttendance from "../pages/student/Attendance";
import FaceEnroll from "../pages/student/FaceEnroll";
import FaceAttendance from "../pages/student/FaceAttendance";
import StudentAnnouncements from "../pages/student/Announcements";
import StudentFees from "../pages/student/Fees";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import AdminEnrollments from "../pages/admin/Enrollments";
import AdminAttendanceApprovals from "../pages/admin/AttendanceApprovals";
import AdminFeeSettings from "../pages/admin/FeeSettings";
import AdminAttendance from "../pages/admin/Attendance";
import AdminFees from "../pages/admin/Fees";
import AdminStudents from "../pages/admin/Students";
import AdminCourses from "../pages/admin/Courses";
import AdminResults from "../pages/admin/Results";
import AdminAnnouncements from "../pages/admin/Announcements";
import AdminProfile from "../pages/admin/Profile";
import AdminAnalytics from "../pages/admin/Analytics";
import AdminLecturers from "../pages/admin/Lecturers";
import AdminResultApprovals from "../pages/admin/ResultApprovals";

// Lecturer
import LecturerDashboard from "../pages/lecturer/Dashboard";
import LecturerAttendance from "../pages/lecturer/Attendance";
import LecturerProfile from "../pages/lecturer/Profile";
import LecturerCourses from "../pages/lecturer/Courses";
import LecturerResults from "../pages/lecturer/Results";
import LecturerStudents from "../pages/lecturer/Students";
import LecturerLiveClasses from "../pages/lecturer/LiveClasses";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="video/:roomId" element={<LiveVideo />} />
        <Route path="face-enroll" element={<FaceEnroll />} />
        <Route path="face-attendance" element={<FaceAttendance />} />
        <Route path="announcements" element={<StudentAnnouncements />} />
        <Route path="fees" element={<StudentFees />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="lecturers" element={<AdminLecturers />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="attendance-approvals" element={<AdminAttendanceApprovals />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="result-approvals" element={<AdminResultApprovals />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="fee-settings" element={<AdminFeeSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Lecturer */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute role="lecturer">
            <LecturerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/lecturer/dashboard" replace />} />
        <Route path="dashboard" element={<LecturerDashboard />} />
        <Route path="courses" element={<LecturerCourses />} />
        <Route path="attendance" element={<LecturerAttendance />} />
        <Route path="results" element={<LecturerResults />} />
        <Route path="students" element={<LecturerStudents />} />
        <Route path="live-classes" element={<LecturerLiveClasses />} />
        <Route path="video/:roomId" element={<LiveVideo />} />
        <Route path="profile" element={<LecturerProfile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}