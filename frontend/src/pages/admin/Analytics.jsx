import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  AlertTriangle, TrendingUp, TrendingDown, Activity,
  DollarSign, Users, Award, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#eab308", "#f97316", "#dc2626"];

export default function AdminAnalytics() {
  const [tab, setTab] = useState("overview");

  // Data
  const [riskData, setRiskData] = useState(null);
  const [feeForecast, setFeeForecast] = useState(null);
  const [enrollmentForecast, setEnrollmentForecast] = useState(null);
  const [tiers, setTiers] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, f, e, t] = await Promise.all([
        api.get("/analytics/at-risk"),
        api.get("/analytics/fee-forecast"),
        api.get("/analytics/enrollment-forecast"),
        api.get("/analytics/performance-tiers"),
      ]);
      setRiskData(r.data);
      setFeeForecast(f.data);
      setEnrollmentForecast(e.data);
      setTiers(t.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) return <Loader text="Running ML predictions..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Predictive Analytics</h1>
          <p className="text-sm text-slate-500">
            AI-powered insights using machine learning
          </p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 flex-wrap">
          {[
            { key: "overview", label: "Overview" },
            { key: "at-risk", label: "At Risk" },
            { key: "forecast", label: "Forecasts" },
            { key: "tiers", label: "Tiers" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs rounded-md ${
                tab === t.key
                  ? "bg-white shadow-sm font-medium"
                  : "text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============ OVERVIEW ============ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Top cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle size={16} />
                High Risk
              </div>
              <p className="text-2xl font-bold mt-1">
                {riskData?.summary.high || 0}
              </p>
              <p className="text-xs text-slate-500">
                students need attention
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Award size={16} />
                Top Performers
              </div>
              <p className="text-2xl font-bold mt-1">
                {tiers?.summary.excellent || 0}
              </p>
              <p className="text-xs text-slate-500">excellent tier</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <DollarSign size={16} />
                Next Month (predicted)
              </div>
              <p className="text-2xl font-bold mt-1">
                ${Math.round(feeForecast?.nextMonth || 0)}
              </p>
              <p className="text-xs text-slate-500">
                {feeForecast?.trend || "—"} trend
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-purple-600 text-sm">
                <Users size={16} />
                Next Year (predicted)
              </div>
              <p className="text-2xl font-bold mt-1">
                {enrollmentForecast?.nextYear || 0}
              </p>
              <p className="text-xs text-slate-500">new students</p>
            </div>
          </div>

          {/* Risk distribution chart */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold mb-3">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "High", value: riskData?.summary.high || 0 },
                      { name: "Medium", value: riskData?.summary.medium || 0 },
                      { name: "Low", value: riskData?.summary.low || 0 },
                      { name: "Safe", value: riskData?.summary.safe || 0 },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <Cell
                        key={i}
                        fill={
                          ["#dc2626", "#f97316", "#eab308", "#16a34a"][i]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold mb-3">Performance Tiers</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: "Excellent", count: tiers?.summary.excellent || 0 },
                    { name: "Good", count: tiers?.summary.good || 0 },
                    { name: "Average", count: tiers?.summary.average || 0 },
                    {
                      name: "Below Avg",
                      count: tiers?.summary.belowAverage || 0,
                    },
                    { name: "At Risk", count: tiers?.summary.atRisk || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============ AT RISK ============ */}
      {tab === "at-risk" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">
              Students Needing Attention
            </h3>
            <span className="text-sm text-slate-500">
              {riskData?.data.length} total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50">
                <th className="p-3">Student</th>
                <th className="p-3 text-center">Risk</th>
                <th className="p-3 text-center">Attendance</th>
                <th className="p-3 text-center">Avg Marks</th>
                <th className="p-3 text-center">Failed</th>
                <th className="p-3 text-center">GPA Trend</th>
                <th className="p-3 text-center">Pending Fees</th>
              </tr>
            </thead>
            <tbody>
              {riskData?.data.map((r) => (
                <tr key={r.student._id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">
                      {r.student.firstName} {r.student.lastName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.student.studentId}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        r.riskCategory === "high"
                          ? "bg-red-100 text-red-700"
                          : r.riskCategory === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : r.riskCategory === "low"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.riskScore} · {r.riskCategory}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {r.metrics.attendancePercent}%
                  </td>
                  <td className="p-3 text-center">{r.metrics.avgMarks}</td>
                  <td className="p-3 text-center">
                    {r.metrics.failedCourses}
                  </td>
                  <td className="p-3 text-center">
                    {r.metrics.gpaTrend > 0 ? (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        <TrendingUp size={12} />
                        {r.metrics.gpaTrend}
                      </span>
                    ) : r.metrics.gpaTrend < 0 ? (
                      <span className="text-red-600 flex items-center justify-center gap-1">
                        <TrendingDown size={12} />
                        {r.metrics.gpaTrend}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {r.metrics.pendingFees > 0 ? (
                      <span className="text-red-600">
                        ${r.metrics.pendingFees}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ FORECASTS ============ */}
      {tab === "forecast" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Fee forecast */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold mb-1">Fee Collection Forecast</h3>
            <p className="text-xs text-slate-500 mb-3">
              Based on historical payments · Confidence:{" "}
              {(feeForecast?.confidence * 100).toFixed(0)}%
            </p>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={[
                  ...(feeForecast?.history || []).map((h) => ({
                    month: h.month,
                    collected: h.collected,
                    predicted: null,
                  })),
                  {
                    month: "NEXT",
                    collected: null,
                    predicted: feeForecast?.nextMonth || 0,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Predicted next</p>
                <p className="font-bold">
                  ${Math.round(feeForecast?.nextMonth || 0)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Trend</p>
                <p className="font-bold capitalize">
                  {feeForecast?.trend || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Enrollment forecast */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold mb-1">Enrollment Forecast</h3>
            <p className="text-xs text-slate-500 mb-3">
              Based on historical enrollment
            </p>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={[
                  ...(enrollmentForecast?.history || []).map((h) => ({
                    year: h.year,
                    count: h.count,
                    predicted: null,
                  })),
                  {
                    year: "NEXT",
                    count: null,
                    predicted: enrollmentForecast?.nextYear || 0,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted"
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Predicted next</p>
                <p className="font-bold">
                  {enrollmentForecast?.nextYear || 0} students
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Trend</p>
                <p className="font-bold capitalize">
                  {enrollmentForecast?.trend || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ TIERS ============ */}
      {tab === "tiers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "excellent", label: "Excellent", color: "green" },
              { key: "good", label: "Good", color: "blue" },
              { key: "average", label: "Average", color: "yellow" },
              {
                key: "below-average",
                label: "Below Avg",
                color: "orange",
              },
              { key: "at-risk", label: "At Risk", color: "red" },
            ].map((t) => (
              <div
                key={t.key}
                className={`rounded-xl border p-4 bg-${t.color}-50 border-${t.color}-200`}
              >
                <p className="text-xs text-slate-600">{t.label}</p>
                <p className="text-2xl font-bold">
                  {tiers?.summary[t.key.replace("-", "")]
                    ? tiers.summary[t.key.replace("-", "")]
                    : t.key === "below-average"
                    ? tiers?.summary.belowAverage
                    : 0}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold mb-3">Tier Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[
                  { tier: "Excellent", count: tiers?.summary.excellent || 0 },
                  { tier: "Good", count: tiers?.summary.good || 0 },
                  { tier: "Average", count: tiers?.summary.average || 0 },
                  {
                    tier: "Below Avg",
                    count: tiers?.summary.belowAverage || 0,
                  },
                  { tier: "At Risk", count: tiers?.summary.atRisk || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" fontSize={11} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* At-risk students list */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-semibold mb-3 text-red-700">
              Students in At-Risk Tier
            </h3>
            {tiers?.tiers["at-risk"].length > 0 ? (
              <ul className="space-y-2">
                {tiers.tiers["at-risk"].map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 text-sm"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-slate-400">
                        {s.studentId}
                      </p>
                    </div>
                    <span className="text-red-600 font-semibold">
                      {s.composite}/100
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">
                No students in at-risk tier. 🎉
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}