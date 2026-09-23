import { useEffect, useState } from "react";
import api from "../../services/api";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import FeeAlert from "../../components/FeeAlert";
import {
  GraduationCap, BookOpen, Calendar, DollarSign, Bell, ClipboardList,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get("/student/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const { stats, recentResults, announcements, enrolledCourses } = data;

  const perfData = (recentResults || []).map((r, i) => ({
    name: r.course?.code || `C${i}`,
    total: r.totalMarks ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName} 👋</h1>
        <p className="text-slate-500 text-sm">
          Semester {user?.semester} · Academic Year 2024/2025
        </p>
      </div>

      {/* 🆕 Fee status alert */}
      <FeeAlert />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Current GPA" value={stats.gpa} icon={GraduationCap} color="primary" />
        <StatCard title="Registered Courses" value={stats.registeredCourses} icon={BookOpen} color="blue" />
        <StatCard title="Attendance" value={`${stats.attendancePercent}%`} icon={Calendar} color="green" />
        <StatCard title="Pending Assignments" value={stats.pendingAssignments} icon={ClipboardList} color="yellow" />
        <StatCard title="Unread Notifications" value={stats.unreadNotifications} icon={Bell} color="purple" />
        <StatCard title="Outstanding Fees" value={`$${stats.outstandingFees}`} icon={DollarSign} color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3">Recent Performance</h3>
          {perfData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm">No approved results yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3">Enrolled Courses</h3>
          <div className="space-y-2">
            {enrolledCourses.length ? (
              enrolledCourses.map((e) => (
                <div key={e._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{e.course?.code}</p>
                    <p className="text-xs text-slate-500">{e.course?.name}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {e.course?.creditHours} cr
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No courses enrolled.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold mb-3">Recent Announcements</h3>
        <div className="space-y-3">
          {announcements.length ? (
            announcements.map((a) => (
              <div key={a._id} className="border-l-4 border-blue-500 pl-3">
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{a.description}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}