import { useEffect, useState } from "react";
import api from "../../services/api";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import {
  BookOpen, Users, ClipboardCheck, Clock, CheckCircle, XCircle,
} from "lucide-react";

export default function LecturerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lecturer/dashboard")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return <p className="text-slate-500">Failed to load dashboard.</p>;

  const { stats, courses } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="My Courses" value={stats.totalCourses} icon={BookOpen} color="primary" />
        <StatCard title="My Students" value={stats.totalStudents} icon={Users} color="blue" />
        <StatCard title="Results Entered" value={stats.enteredResults} icon={ClipboardCheck} color="purple" />
        <StatCard title="Pending" value={stats.pendingResults} icon={Clock} color="yellow" />
        <StatCard title="Approved" value={stats.approvedResults} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={stats.rejectedResults} icon={XCircle} color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold mb-3">My Assigned Courses</h3>
        {courses?.length ? (
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{c.code} · {c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c.department?.name || "—"} · Semester {c.semester}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {c.creditHours} cr
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">
            No courses assigned yet. Contact the administrator to assign you to courses.
          </p>
        )}
      </div>
    </div>
  );
}