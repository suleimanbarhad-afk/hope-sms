import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/results/my")
      .then((res) => setResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gpaCalc = () => {
    let pts = 0;
    let cr = 0;
    results.forEach((r) => {
      const c = r.course?.creditHours || 0;
      pts += (r.gradePoint || 0) * c;
      cr += c;
    });
    return {
      gpa: cr ? (pts / cr).toFixed(2) : "0.00",
      credits: cr,
    };
  };

  const { gpa, credits } = gpaCalc();

  const chartData = results.map((r) => ({
    name: r.course?.code || "—",
    total: r.totalMarks,
  }));

  if (loading) return <Loader text="Loading results..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Results</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500">CGPA</p>
          <p className="text-2xl font-bold text-blue-600">{gpa}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500">Total Credits</p>
          <p className="text-2xl font-bold">{credits}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500">Approved Results</p>
          <p className="text-2xl font-bold">{results.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm text-slate-500">Best Grade</p>
          <p className="text-2xl font-bold">
            {results.reduce(
              (a, r) => (r.gradePoint > (a.gradePoint || 0) ? r : a),
              {}
            ).grade || "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="p-3">Code</th>
              <th className="p-3">Course</th>
              <th className="p-3">Cr</th>
              <th className="p-3 text-center" title="Assignment (max 10)">A</th>
              <th className="p-3 text-center" title="Coursework (max 10)">C</th>
              <th className="p-3 text-center" title="Test (max 10)">T</th>
              <th className="p-3 text-center" title="Main Exam (max 70)">E</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Point</th>
              <th className="p-3">Semester</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-medium">{r.course?.code}</td>
                <td className="p-3">{r.course?.name}</td>
                <td className="p-3">{r.course?.creditHours}</td>
                <td className="p-3 text-center">{r.assignmentMarks}</td>
                <td className="p-3 text-center">{r.courseworkMarks}</td>
                <td className="p-3 text-center">{r.testMarks}</td>
                <td className="p-3 text-center">{r.examMarks}</td>
                <td className="p-3 text-center font-semibold">{r.totalMarks}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                    {r.grade}
                  </span>
                </td>
                <td className="p-3">{r.gradePoint}</td>
                <td className="p-3">{r.semester}</td>
              </tr>
            ))}
            {!results.length && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  No approved results yet. Once your lecturers submit marks and admin approves
                  them, they'll appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {results.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => window.print()}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium px-4 py-2 rounded-lg text-sm"
            >
              Print Transcript
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <p className="font-medium text-slate-700 mb-1">Marks breakdown</p>
        <p>
          <strong>A</strong> = Assignment (10) ·{" "}
          <strong>C</strong> = Coursework (10) ·{" "}
          <strong>T</strong> = Test (10) ·{" "}
          <strong>E</strong> = Main Exam (70) ·{" "}
          <strong>Total</strong> = 100
        </p>
      </div>
    </div>
  );
}