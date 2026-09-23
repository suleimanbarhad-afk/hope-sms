import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/my").then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading attendance..." />;
  if (!data) return null;

  const totals = data.records.reduce(
    (a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }),
    { present: 0, absent: 0, late: 0 }
  );

  const pieData = [
    { name: "Present", value: totals.present, fill: "#16a34a" },
    { name: "Late", value: totals.late, fill: "#eab308" },
    { name: "Absent", value: totals.absent, fill: "#dc2626" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-slate-500">Overall Attendance</p>
          <p className="text-3xl font-bold text-primary-600">{data.overall}%</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Total Records</p>
          <p className="text-3xl font-bold">{data.records.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-500">Courses</p>
          <p className="text-3xl font-bold">{data.courses.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-3">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold">Course Breakdown</h3>
          {data.courses.map((c) => (
            <div key={c.course?._id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{c.course?.code} · {c.course?.name}</span>
                <span>{c.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Present: {c.present} · Late: {c.late} · Absent: {c.absent}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}