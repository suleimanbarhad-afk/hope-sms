export const adminNavigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    section: "ACADEMIC",
    items: [
      { label: "Students", to: "/admin/students", icon: "Users" },
      { label: "Lecturers", to: "/admin/lecturers", icon: "GraduationCap" },
      { label: "Courses", to: "/admin/courses", icon: "BookOpen" },
      { label: "Enrollments", to: "/admin/enrollments", icon: "UserPlus" },
      { label: "Attendance Approvals", to: "/admin/attendance-approvals", icon: "CalendarCheck" },
      { label: "Results", to: "/admin/results", icon: "ClipboardCheck" },
      { label: "Result Approvals", to: "/admin/result-approvals", icon: "CheckCircle" },
      { label: "Analytics", to: "/admin/analytics", icon: "BarChart3" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { label: "Fees", to: "/admin/fees", icon: "DollarSign" },
      { label: "Settings", to: "/admin/fee-settings", icon: "Settings" },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      { label: "Announcements", to: "/admin/announcements", icon: "Megaphone" },
      { label: "Notifications", to: "/admin/notifications", icon: "Bell" },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "Admin Profile", to: "/admin/profile", icon: "User" },
    ],
  },
];

export const lecturerNavigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", to: "/lecturer/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    section: "TEACHING",
    items: [
      { label: "My Courses", to: "/lecturer/courses", icon: "BookOpen" },
      { label: "Attendance", to: "/lecturer/attendance", icon: "CalendarCheck" },
      { label: "Enter Results", to: "/lecturer/results", icon: "ClipboardCheck" },
      { label: "My Students", to: "/lecturer/students", icon: "Users" },
      { label: "Live Classes", to: "/lecturer/live-classes", icon: "Video" },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      { label: "Notifications", to: "/lecturer/notifications", icon: "Bell" },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "My Profile", to: "/lecturer/profile", icon: "User" },
    ],
  },
];

export const studentNavigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", to: "/student/dashboard", icon: "LayoutDashboard" },
    ],
  },
  {
    section: "ACADEMIC",
    items: [
      { label: "My Courses", to: "/student/courses", icon: "BookOpen" },
      { label: "My Results", to: "/student/results", icon: "ClipboardCheck" },
      { label: "Attendance", to: "/student/attendance", icon: "CalendarCheck" },
    ],
  },
  {
    section: "COMMUNICATION",
    items: [
      { label: "Announcements", to: "/student/announcements", icon: "Megaphone" },
      { label: "Notifications", to: "/student/notifications", icon: "Bell" },
      { label: "Live Classes", to: "/student/live-classes", icon: "Video" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { label: "My Fees", to: "/student/fees", icon: "DollarSign" },
    ],
  },
  {
    section: "ACCOUNT",
    items: [
      { label: "My Profile", to: "/student/profile", icon: "User" },
    ],
  },
];

export const getNavigation = (role) => {
  if (role === "admin") return adminNavigation;
  if (role === "lecturer") return lecturerNavigation;
  return studentNavigation;
};