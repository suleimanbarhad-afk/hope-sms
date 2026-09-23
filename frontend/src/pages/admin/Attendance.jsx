import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  Save, CheckCircle, Clock, XCircle, Users, Calendar,
} from "lucide-react";

export default function AdminAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    api
      .get("/courses?limit=200")
      .then((r) => setCourses(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setAttendance({});
      return;
    }
    setLoading(true);
    api
      .get(`/enrollments/course/${selectedCourse}/students`)
      .then((r) => {
        const list = r.data || [];
        setStudents(list);
        const initial = {};
        list.forEach((e) => {
          initial[e.student._id] = "present";
        });
        setAttendance(initial);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load students")
      )
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedCourse || !date) return;
    (async () => {
      try {
        const res = await api.get("/attendance", {
          params: { course: selectedCourse },
        });
        const sameDay = res.data.filter((a) => {
          const d = new Date(a.date).toISOString().split("T")[0];
          return d === date;
        });
        setAttendance((prev) => {
          const next = { ...prev };
          sameDay.forEach((a) => {
            next[a.student._id] = a.status;
          });
          return next;
        });
      } catch (err) {}
    })();
  }, [selectedCourse, date]);

  const loadHistory = async () => {
    if (!selectedCourse) return;
    try {
      setLoadingHistory(true);
      const res = await api.get("/attendance", {
        params: { course: selectedCourse },
      });
      setHistory(res.data || []);
    } catch (err) {}
    finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    /* eslint-disable-next-line */
  }, [selectedCourse]);

  const setStatus = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach((e) => {
      next[e.student._id] = status;
    });
    setAttendance(next);
  };

  const save = async () => {
    if (!selectedCourse) {
      toast.error("Select a course first");
      return;
    }
    if (!students.length) {
      toast.error("No students enrolled in this course");
      return;
    }
    const records = students.map((e) => ({
      student: e.student._id,
      status: attendance[e.student._id] || "present",
    }));
    try {
      setSaving(true);
      await api.post("/attendance/bulk", {
        course: selectedCourse,
        date,
        records,
      });
      toast.success(`Attendance saved for ${records.length} students`);
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const counts = students.reduce(
    (acc, e) => {
      const s = attendance[e.student._id] || "present";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 }
  );

  const summary = {};
  history.forEach((h) => {
    const sid = h.student?._id;
    if (!sid) return;
    if (!summary[sid]) {
      summary[sid] = { student: h.student, present: 0, late: 0, absent: 0 };
    }
    summary[sid][h.status]++;
  });
  const summaryRows = Object.values(summary).map((s) => ({
    ...s,
    total: s.present + s.late + s.absent,
    percent:
      s.present + s.late + s.absent
        ? +(((s.present + s.late) / (s.present + s.late + s.absent)) * 100).toFixed(1)
        : 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Course
          </label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select a course...</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date
          </label>
          <input
            type="date"
            max={new Date().toISOString().split("T")[0]}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-slate-500" />
              <span className="font-semibold">
                {students.length} student{students.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-500">
                Present: {counts.present} · Late: {counts.late} · Absent: {counts.absent}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => markAll("present")}
                className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded"
              >
                Mark all present
              </button>
              <button
                type="button"
                onClick={() => markAll("absent")}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded"
              >
                Mark all absent
              </button>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading students..." />
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No students enrolled in this course.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="p-3">Student ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((e) => {
                      const status = attendance[e.student._id] || "present";
                      return (
                        <tr key={e._id} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{e.student.studentId}</td>
                          <td className="p-3">
                            {e.student.firstName} {e.student.lastName}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setStatus(e.student._id, "present")}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                                  status === "present"
                                    ? "bg-green-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-green-50"
                                }`}
                              >
                                <CheckCircle size={13} /> Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatus(e.student._id, "late")}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                                  status === "late"
                                    ? "bg-yellow-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-yellow-50"
                                }`}
                              >
                                <Clock size={13} /> Late
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatus(e.student._id, "absent")}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                                  status === "absent"
                                    ? "bg-red-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-red-50"
                                }`}
                              >
                                <XCircle size={13} /> Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {summaryRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            Attendance Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Student</th>
                  <th className="p-3 text-green-700">Present</th>
                  <th className="p-3 text-yellow-700">Late</th>
                  <th className="p-3 text-red-700">Absent</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">%</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s) => (
                  <tr key={s.student._id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">
                      {s.student.studentId} · {s.student.firstName} {s.student.lastName}
                    </td>
                    <td className="p-3">{s.present}</td>
                    <td className="p-3">{s.late}</td>
                    <td className="p-3">{s.absent}</td>
                    <td className="p-3">{s.total}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          s.percent >= 75
                            ? "bg-green-100 text-green-700"
                            : s.percent >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.percent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}