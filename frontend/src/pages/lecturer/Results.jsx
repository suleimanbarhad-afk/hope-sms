import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { ClipboardCheck, Lock, Save, X, AlertCircle } from "lucide-react";

const EMPTY_FORM = {
  attendanceMarks: 0,
  courseworkMarks: 0,
  testMarks: 0,
  examMarks: 0,
};

export default function LecturerResults() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);

  const loadBase = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        api.get("/lecturer/courses"),
        api.get("/lecturer/students"),
      ]);
      setCourses(coursesRes.data || []);
      setStudents(studentsRes.data || []);

      const mine = await api.get("/results/my-entries");
      setResults(mine.data || []);
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    (async () => {
      await loadBase();
      setLoading(false);
    })();
  }, []);

  // Load selected course info (examOpen gate)
  useEffect(() => {
    if (!selectedCourse) {
      setCourseInfo(null);
      return;
    }
    api.get(`/courses/${selectedCourse}`).then((r) => setCourseInfo(r.data));
  }, [selectedCourse]);

  const studentsInCourse = selectedCourse
    ? students.filter((e) => e.course?._id === selectedCourse)
    : [];

  const findResult = (studentId, courseId) =>
    results.find(
      (r) => r.student?._id === studentId && r.course?._id === courseId
    );

  const openEntry = (enrollment) => {
    const existing = findResult(enrollment.student._id, enrollment.course._id);
    setCurrentStudent(enrollment.student);
    if (existing) {
      setEditing(existing);
      setForm({
        attendanceMarks: existing.attendanceMarks ?? 0,
        courseworkMarks: existing.courseworkMarks ?? 0,
        testMarks: existing.testMarks ?? 0,
        examMarks: existing.examMarks ?? 0,
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setCurrentStudent(null);
    setForm(EMPTY_FORM);
  };

  const total =
    Number(form.attendanceMarks || 0) +
    Number(form.courseworkMarks || 0) +
    Number(form.testMarks || 0) +
    Number(form.examMarks || 0);

  const courseObj = courses.find((c) => c._id === selectedCourse);
  const examOpen = courseInfo?.examOpen;
  const examLocked = editing?.examLocked;

  const save = async (e) => {
    e.preventDefault();
    if (!currentStudent || !courseObj) return;

    try {
      setSaving(true);

      const payload = {
        student: currentStudent._id,
        course: courseObj._id,
        semester: courseObj.semester,
        academicYear: courseObj.academicYear,
        courseworkMarks: Number(form.courseworkMarks),
        testMarks: Number(form.testMarks),
        examMarks: Number(form.examMarks),
      };

      if (editing) {
        await api.put(`/results/${editing._id}`, payload);
        toast.success("Result updated");
      } else {
        await api.post("/results", payload);
        toast.success("Result submitted for approval");
      }

      const mine = await api.get("/results/my-entries");
      setResults(mine.data);
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading results..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Enter Results</h1>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm sm:w-72"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select a course...</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.code} · {c.name}</option>
          ))}
        </select>
      </div>

      {/* Exam gate warning */}
      {selectedCourse && courseInfo && !courseInfo.examOpen && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Exam entry is closed</p>
            <p>
              The administrator hasn't opened exam entry for this course yet.
              You can still enter coursework and test marks now.
            </p>
          </div>
        </div>
      )}

      {!selectedCourse ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <ClipboardCheck className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="text-slate-500">Select a course to view students and enter marks.</p>
        </div>
      ) : studentsInCourse.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No students enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Student ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Att(10)</th>
                <th className="p-3">CW(10)</th>
                <th className="p-3">Test(10)</th>
                <th className="p-3">Exam(70)</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {studentsInCourse.map((e) => {
                const r = findResult(e.student._id, e.course._id);
                return (
                  <tr key={e._id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{e.student.studentId}</td>
                    <td className="p-3">{e.student.firstName} {e.student.lastName}</td>
                    <td className="p-3">
                      {r?.attendanceMarks !== undefined && r?.attendanceMarks !== 0 ? (
                        <span className="text-green-700 font-medium">
                          {r.attendanceMarks}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">pending approval</span>
                      )}
                    </td>
                    <td className="p-3">{r?.courseworkMarks ?? "—"}</td>
                    <td className="p-3">{r?.testMarks ?? "—"}</td>
                    <td className="p-3">
                      {r?.examMarks ?? "—"}
                      {r?.examLocked && <Lock size={12} className="inline ml-1 text-slate-400" />}
                    </td>
                    <td className="p-3 font-medium">{r?.totalMarks ?? "—"}</td>
                    <td className="p-3">
                      {r ? (
                        <span className={`text-xs px-2 py-1 rounded capitalize ${
                          r.status === "approved" ? "bg-green-100 text-green-700" :
                          r.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {r.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not entered</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => openEntry(e)}
                        disabled={r?.status === "approved"}
                        className={`text-xs px-3 py-1 rounded ${
                          r?.status === "approved"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {r ? (r.status === "approved" ? "Locked" : "Edit") : "Enter"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && currentStudent && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form onSubmit={save} className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {editing ? "Edit" : "Enter"} Result
                </h3>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-slate-500">Student:</span> {currentStudent.firstName} {currentStudent.lastName}</p>
                <p><span className="text-slate-500">Student ID:</span> {currentStudent.studentId}</p>
                <p><span className="text-slate-500">Course:</span> {courseObj?.code} · {courseObj?.name}</p>
              </div>

              {editing?.status === "rejected" && editing.rejectionReason && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
                  <strong>Rejected:</strong> {editing.rejectionReason}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Attendance — readonly */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Attendance <span className="text-slate-400">(0–10)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                    value={
                      editing?.attendanceMarks !== undefined
                        ? editing.attendanceMarks
                        : "Pending approval"
                    }
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-calculated after admin approves attendance
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Coursework <span className="text-slate-400">(0–10)</span>
                  </label>
                  <input
                    type="number" min={0} max={10}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.courseworkMarks}
                    onChange={(e) => setForm({ ...form, courseworkMarks: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Test <span className="text-slate-400">(0–10)</span>
                  </label>
                  <input
                    type="number" min={0} max={10}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.testMarks}
                    onChange={(e) => setForm({ ...form, testMarks: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    Exam <span className="text-slate-400">(0–70)</span>
                    {editing?.examLocked && <Lock size={12} className="text-slate-400" />}
                  </label>
                  <input
                    type="number" min={0} max={70}
                    disabled={editing?.examLocked || !examOpen}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      editing?.examLocked || !examOpen
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                        : "border-slate-300"
                    }`}
                    value={form.examMarks}
                    onChange={(e) => setForm({ ...form, examMarks: e.target.value })}
                  />
                  {!examOpen && !editing?.examLocked && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Exam entry not yet opened by admin
                    </p>
                  )}
                  {editing?.examLocked && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Exam mark is locked
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-slate-700">Total (partial)</span>
                <span className="text-lg font-bold text-blue-700">{total} / 100</span>
              </div>

              <p className="text-xs text-slate-500">
                Note: Attendance contributes up to 10 marks (auto) after admin approves. Total will update automatically.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : editing ? "Update" : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}