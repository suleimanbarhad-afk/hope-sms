import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  Save, CheckCircle, Clock, XCircle, Users, Send,
  AlertCircle, CheckCircle2, XCircle as XIcon, Calendar, Eye, X,
} from "lucide-react";

export default function LecturerAttendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [courseInfo, setCourseInfo] = useState(null);

  // History panel
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Per-student summary
  const [summary, setSummary] = useState({ totalDays: 0, students: [] });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Student detail modal
  const [detailModal, setDetailModal] = useState(null); // { student, records }
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api.get("/lecturer/courses").then((r) => setCourses(r.data || []));
  }, []);

  // Load course + attendance for selected course/date
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setAttendance({});
      setCourseInfo(null);
      setHistory([]);
      setSummary({ totalDays: 0, students: [] });
      return;
    }

    api.get(`/courses/${selectedCourse}`)
      .then((r) => setCourseInfo(r.data))
      .catch(() => {});

    setLoading(true);
    api.get(`/attendance/course/${selectedCourse}/today`, { params: { date } })
      .then((r) => {
        const list = r.data.students || [];
        setStudents(list);
        const initial = {};
        list.forEach((e) => {
          initial[e.student._id] = r.data.existingMarks[e.student._id] || "present";
        });
        setAttendance(initial);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load students")
      )
      .finally(() => setLoading(false));
  }, [selectedCourse, date]);

  const loadHistory = async () => {
    if (!selectedCourse) return;
    try {
      setLoadingHistory(true);
      const res = await api.get(`/attendance/course/${selectedCourse}/history`);
      setHistory(res.data || []);
    } catch (err) {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSummary = async () => {
    if (!selectedCourse) return;
    try {
      setLoadingSummary(true);
      const res = await api.get(
        `/attendance/course/${selectedCourse}/students-summary`
      );
      setSummary(res.data || { totalDays: 0, students: [] });
    } catch (err) {
      // silent
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadSummary();
    /* eslint-disable-next-line */
  }, [selectedCourse]);

  const openDetail = async (studentId) => {
    try {
      setLoadingDetail(true);
      setDetailModal({ studentId, data: null });
      const res = await api.get(
        `/attendance/course/${selectedCourse}/student/${studentId}/detail`
      );
      setDetailModal({ studentId, data: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load detail");
      setDetailModal(null);
    } finally {
      setLoadingDetail(false);
    }
  };

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
    if (!selectedCourse) return toast.error("Select a course first");
    if (!students.length) return toast.error("No students enrolled");

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
      toast.success("Attendance saved");
      loadHistory();
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!selectedCourse) return;
    if (!confirm(
      "Submit attendance to admin? You won't be able to edit after submission until admin reviews."
    )) return;

    try {
      setSubmitting(true);
      const r = await api.post(`/attendance/course/${selectedCourse}/submit`);
      toast.success(r.data.message || "Submitted to admin");
      if (r.data.warning) {
        toast(r.data.warning, { icon: "⚠️", duration: 6000 });
      }
      const info = await api.get(`/courses/${selectedCourse}`);
      setCourseInfo(info.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
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

  const attendanceOpen = courseInfo?.attendanceOpen;
  const attendanceStatus = courseInfo?.attendanceStatus || "draft";
  const editable =
    attendanceOpen &&
    attendanceStatus !== "submitted" &&
    attendanceStatus !== "approved";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Take Attendance</h1>
        {courseInfo && <StatusBadge status={attendanceStatus} />}
      </div>

      {/* Controls */}
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
            disabled={!editable}
          />
        </div>
      </div>

      {/* Status banners */}
      {selectedCourse && courseInfo && (
        <>
          {!attendanceOpen && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Attendance entry is closed</p>
                <p>The administrator hasn't opened attendance for this course yet.</p>
              </div>
            </div>
          )}
          {attendanceStatus === "submitted" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Send className="text-blue-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Submitted to admin</p>
                <p>Waiting for approval.</p>
              </div>
            </div>
          )}
          {attendanceStatus === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="text-green-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-green-900">
                <p className="font-semibold">Attendance approved</p>
                <p>Marks have been automatically calculated and recorded.</p>
              </div>
            </div>
          )}
          {attendanceStatus === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XIcon className="text-red-600 mt-0.5 shrink-0" size={20} />
              <div className="text-sm text-red-900 flex-1">
                <p className="font-semibold">Attendance rejected</p>
                <p className="mb-1">{courseInfo.attendanceRejectedReason}</p>
                <p>Fix the issues and submit again.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mark list */}
      {selectedCourse && attendanceOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-slate-500" />
              <span className="font-semibold">
                {students.length} student{students.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-slate-500">
                P: {counts.present} · L: {counts.late} · A: {counts.absent}
              </span>
            </div>
            {editable && (
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
            )}
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
                          <td className="p-3 font-medium">
                            {e.student.studentId}
                          </td>
                          <td className="p-3">
                            {e.student.firstName} {e.student.lastName}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setStatus(e.student._id, "present")}
                                disabled={!editable}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
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
                                disabled={!editable}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
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
                                disabled={!editable}
                                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
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

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
                <button
                  onClick={save}
                  disabled={!editable || saving}
                  className="flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save for this day"}
                </button>
                {attendanceStatus !== "approved" && attendanceStatus !== "submitted" && (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Send size={16} />
                    {submitting ? "Submitting..." : "Submit to admin"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* =============== PER-STUDENT SUMMARY =============== */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              Student Attendance Summary
              {summary.totalDays > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  ({summary.totalDays} class days)
                </span>
              )}
            </h3>
          </div>

          {loadingSummary ? (
            <Loader text="Loading summary..." />
          ) : summary.students.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No students enrolled.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="p-3">Student</th>
                    <th className="p-3 text-center text-green-700">Present</th>
                    <th className="p-3 text-center text-yellow-700">Late</th>
                    <th className="p-3 text-center text-red-700">Absent</th>
                    <th className="p-3 text-center">Attended / Total</th>
                    <th className="p-3 text-center">%</th>
                    <th className="p-3 text-center">Marks</th>
                    <th className="p-3 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.students.map((s) => (
                    <tr key={s.student._id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium">
                          {s.student.studentId} · {s.student.firstName}{" "}
                          {s.student.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.student.email}
                        </div>
                      </td>
                      <td className="p-3 text-center">{s.present}</td>
                      <td className="p-3 text-center">{s.late}</td>
                      <td className="p-3 text-center">{s.absent}</td>
                      <td className="p-3 text-center text-xs">
                        {s.attended} / {s.total}
                      </td>
                      <td className="p-3 text-center">
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
                      <td className="p-3 text-center font-semibold">
                        {s.marks} / 10
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openDetail(s.student._id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =============== DAILY HISTORY =============== */}
      {selectedCourse && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              Daily History
              {history.length > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  ({history.length} day{history.length !== 1 ? "s" : ""} marked)
                </span>
              )}
            </h3>
          </div>

          {loadingHistory ? (
            <Loader text="Loading history..." />
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No attendance marked yet.
            </p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {history.map((h) => {
                const isSelected = h.date === date;
                return (
                  <button
                    key={h.date}
                    onClick={() => setDate(h.date)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition text-left ${
                      isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-slate-400" />
                      <div>
                        <p className="font-medium">
                          {new Date(h.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {isSelected && (
                          <p className="text-xs text-blue-600">Currently editing</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle size={12} /> {h.present}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-700">
                        <Clock size={12} /> {h.late}
                      </span>
                      <span className="flex items-center gap-1 text-red-700">
                        <XCircle size={12} /> {h.absent}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =============== STUDENT DETAIL MODAL =============== */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Student Attendance Detail</h3>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail || !detailModal.data ? (
                <Loader text="Loading..." />
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">
                      {detailModal.data.student.firstName}{" "}
                      {detailModal.data.student.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {detailModal.data.student.studentId} ·{" "}
                      {detailModal.data.student.email}
                    </p>
                  </div>

                  {detailModal.data.records.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">
                      No attendance records for this student yet.
                    </p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="text-left text-slate-600">
                            <th className="p-3">Date</th>
                            <th className="p-3">Day</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailModal.data.records.map((r) => (
                            <tr key={r._id} className="border-t">
                              <td className="p-3 font-medium">
                                {new Date(r.date).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-slate-500">
                                {new Date(r.date).toLocaleDateString(undefined, {
                                  weekday: "long",
                                })}
                              </td>
                              <td className="p-3">
                                {r.status === "present" && (
                                  <span className="flex items-center gap-1 text-green-700 text-xs">
                                    <CheckCircle size={13} /> Present
                                  </span>
                                )}
                                {r.status === "late" && (
                                  <span className="flex items-center gap-1 text-yellow-700 text-xs">
                                    <Clock size={13} /> Late
                                  </span>
                                )}
                                {r.status === "absent" && (
                                  <span className="flex items-center gap-1 text-red-700 text-xs">
                                    <XCircle size={13} /> Absent
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t">
                    <button
                      onClick={() => setDetailModal(null)}
                      className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft: { bg: "bg-slate-100 text-slate-700", label: "Draft" },
    submitted: { bg: "bg-blue-100 text-blue-700", label: "Submitted" },
    approved: { bg: "bg-green-100 text-green-700", label: "Approved" },
    rejected: { bg: "bg-red-100 text-red-700", label: "Rejected" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${s.bg}`}>
      {s.label}
    </span>
  );
}