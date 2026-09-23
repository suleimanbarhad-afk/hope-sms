import { useEffect, useState } from "react";
import api from "../../services/api";
import StatCard from "../../components/StatCard";
import Loader from "../../components/Loader";
import { Users, BookOpen, Building2, GraduationCap, UserCheck, DollarSign, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#dc2626", "#a855f7", "#0891b2"];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (!data) return <p>Failed to load.</p>;

  const { stats, charts } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
        <StatCard title="Active Students" value={stats.activeStudents} icon={UserCheck} color="green" />
        <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="blue" />
        <StatCard title="Departments" value={stats.totalDepartments} icon={Building2} color="purple" />
        <StatCard title="Average GPA" value={stats.averageGpa} icon={GraduationCap} color="yellow" />
        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={Activity} color="green" />
        <StatCard title="Outstanding Fees" value={`$${stats.outstandingFees}`} icon={DollarSign} color="red" />
        <StatCard title="Enrollment Trends" value={charts.enrollmentTrends?.length || 0} icon={TrendingUp} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3">Students by Department</h3>
          {charts.studentsByDept?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.studentsByDept}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm">No data.</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3">Students by Year</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={(charts.studentsByYear || []).map((s) => ({ name: `Year ${s._id}`, value: s.count }))}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {(charts.studentsByYear || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.enrollmentTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}