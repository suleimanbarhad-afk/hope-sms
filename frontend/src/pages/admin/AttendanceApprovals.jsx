import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  CheckCircle, XCircle, Eye, X, AlertCircle, Send, Calendar,
} from "lucide-react";

export default function AdminAttendanceApprovals() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("submitted");

  // Preview modal
  const [preview, setPreview] = useState(null); // { courseId, data }
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/attendance/submissions", { params: { status: filter } })
      .then((r) => setSubmissions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [filter]);

  const openPreview = async (courseId) => {
    try {
      setLoadingPreview(true);
      setPreview({ courseId, data: null });
      const r = await api.get(`/attendance/course/${courseId}/preview`);
      setPreview({ courseId, data: r.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load preview");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const approve = async (courseId) => {
    if (!confirm("Approve this attendance? Marks will be auto-computed.")) return;
    try {
      setProcessing(true);
      const r = await api.put(`/attendance/course/${courseId}/approve`);
      toast.success(
        `Approved — ${r.data.studentsUpdated} students updated (${r.data.totalDays} days)`
      );
      setPreview(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    if (!rejectTarget) return;
    try {
      setProcessing(true);
      await api.put(`/attendance/course/${rejectTarget}/reject`, {
        reason: rejectReason || "Rejected by admin",
      });
      toast.success("Rejected");
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  const statusColor = (s) => {
    if (s === "submitted") return "bg-blue-100 text-blue-700";
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance Approvals</h1>
          <p className="text-sm text-slate-500">
            Review submitted attendance sheets. On approval, marks are auto-calculated.
          </p>
        </div>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="submitted">Pending (Submitted)</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <Loader text="Loading submissions..." />
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={44} />
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm">
            No attendance submissions in this state.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Course</th>
                <th className="p-3">Lecturer</th>
                <th className="p-3">Days Marked</th>
                <th className="p-3">Students</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((c) => (
                <tr key={c._id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-medium">{c.code}</div>
                    <div className="text-xs text-slate-400">{c.name}</div>
                  </td>
                  <td className="p-3">
                    {c.lecturer ? (
                      <div>
                        <div>{c.lecturer.firstName} {c.lecturer.lastName}</div>
                        <div className="text-xs text-slate-400">
                          {c.lecturer.staffId || c.lecturer.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {c.daysMarked < 20 ? (
                      <span className="text-amber-700 font-medium">
                        ⚠️ {c.daysMarked}
                      </span>
                    ) : (
                      <span>{c.daysMarked}</span>
                    )}
                  </td>
                  <td className="p-3">{c.enrolledStudents}</td>
                  <td className="p-3 text-xs">
                    {c.attendanceSubmittedAt
                      ? new Date(c.attendanceSubmittedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${statusColor(c.attendanceStatus)}`}>
                      {c.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPreview(c._id)}
                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs"
                        title="Preview"
                      >
                        <Eye size={13} /> View
                      </button>
                      {c.attendanceStatus === "submitted" && (
                        <>
                          <button
                            onClick={() => approve(c._id)}
                            disabled={processing}
                            className="flex items-center gap-1 text-green-700 hover:bg-green-50 px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => setRejectTarget(c._id)}
                            disabled={processing}
                            className="flex items-center gap-1 text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Attendance Preview</h3>
                <button
                  onClick={() => setPreview(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingPreview || !preview.data ? (
                <Loader text="Loading..." />
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Course</p>
                      <p className="font-semibold">
                        {preview.data.course.code} · {preview.data.course.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Lecturer</p>
                      <p className="font-semibold">
                        {preview.data.course.lecturer
                          ? `${preview.data.course.lecturer.firstName} ${preview.data.course.lecturer.lastName}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Total Class Days</p>
                      <p className="font-semibold">{preview.data.totalDays}</p>
                    </div>
                  </div>

                  {preview.data.totalDays < 20 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="text-amber-600 mt-0.5" size={16} />
                      <p className="text-xs text-amber-900">
                        Only <strong>{preview.data.totalDays}</strong> days marked. Review carefully before approving.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-slate-600">
                          <th className="p-3">Student</th>
                          <th className="p-3 text-center">Present</th>
                          <th className="p-3 text-center">Late</th>
                          <th className="p-3 text-center">Absent</th>
                          <th className="p-3 text-center">Attended</th>
                          <th className="p-3 text-center">%</th>
                          <th className="p-3 text-center">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.students.map((s) => (
                          <tr key={s.student._id} className="border-t">
                            <td className="p-3">
                              <div className="font-medium">
                                {s.student.studentId} · {s.student.firstName}{" "}
                                {s.student.lastName}
                              </div>
                            </td>
                            <td className="p-3 text-center">{s.present}</td>
                            <td className="p-3 text-center">{s.late}</td>
                            <td className="p-3 text-center">{s.absent}</td>
                            <td className="p-3 text-center">{s.attended}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  s.percent >= 75
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {s.percent}%
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold">
                              {s.marks} / 10
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPreview(null)}
                      className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                    >
                      Close
                    </button>
                    {preview.data.course.attendanceStatus === "submitted" && (
                      <>
                        <button
                          onClick={() => {
                            setRejectTarget(preview.courseId);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => approve(preview.courseId)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          {processing ? "Approving..." : "Approve Attendance"}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg">Reject Attendance</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Why is this rejected?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={processing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}