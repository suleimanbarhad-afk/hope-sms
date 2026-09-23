import { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { UserPlus, X, Trash2, Users, Filter } from "lucide-react";

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Single enroll modal
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    student: "",
    course: "",
    semester: 1,
    academicYear: "2024/2025",
  });
  const [saving, setSaving] = useState(false);

  // Bulk enroll modal
  const [showBulk, setShowBulk] = useState(false);
  const [bulkCourse, setBulkCourse] = useState("");
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ---- Load enrollments ----
  const load = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (filterCourse) params.course = filterCourse;
    if (filterSemester) params.semester = filterSemester;
    if (filterYear) params.academicYear = filterYear;

    api.get("/enrollments", { params })
      .then((r) => {
        setEnrollments(r.data.data);
        setPages(r.data.pages);
        setTotal(r.data.total);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  // Load courses + students once
  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, studentsRes] = await Promise.all([
          api.get("/courses?limit=200"),
          api.get("/students?limit=500"),
        ]);
        setCourses(coursesRes.data.data || []);
        setStudents(studentsRes.data.data || []);
      } catch (err) {
        // silent
      }
    })();
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, filterCourse, filterSemester, filterYear]);

  // ---- Single enroll ----
  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.student || !enrollForm.course) {
      toast.error("Select student and course");
      return;
    }
    try {
      setSaving(true);
      await api.post("/enrollments", enrollForm);
      toast.success("Student enrolled");
      setShowEnroll(false);
      setEnrollForm({ student: "", course: "", semester: 1, academicYear: "2024/2025" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll");
    } finally {
      setSaving(false);
    }
  };

  // ---- Bulk enroll: load available students when course changes ----
  useEffect(() => {
    if (!bulkCourse || !showBulk) return;
    setLoadingAvailable(true);
    setSelectedStudents(new Set());
    api.get(`/enrollments/available-students/${bulkCourse}`)
      .then((r) => setAvailableStudents(r.data))
      .catch(() => setAvailableStudents([]))
      .finally(() => setLoadingAvailable(false));
  }, [bulkCourse, showBulk]);

  const toggleStudent = (id) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
  };

  const toggleAllStudents = () => {
    if (selectedStudents.size === availableStudents.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(availableStudents.map((s) => s._id)));
  };

  const handleBulkEnroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Select at least one student");
      return;
    }
    try {
      setBulkSaving(true);
      const res = await api.post("/enrollments/bulk", {
        course: bulkCourse,
        studentIds: [...selectedStudents],
      });
      toast.success(res.data.message);
      setShowBulk(false);
      setBulkCourse("");
      setSelectedStudents(new Set());
      setAvailableStudents([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setBulkSaving(false);
    }
  };

  // ---- Delete ----
  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/enrollments/${confirmDelete._id}`);
      toast.success("Enrollment removed");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // ---- Student list for dropdown (memoized) ----
  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        _id: s._id,
        label: `${s.studentId || "?"} · ${s.firstName} ${s.lastName}`,
      })),
    [students]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Enrollments</h1>
          <p className="text-sm text-slate-500">
            {total} enrollment{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm"
          >
            <Users size={16} />
            Bulk Enroll
          </button>
          <button
            onClick={() => setShowEnroll(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            <UserPlus size={16} />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Course</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} · {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={filterSemester}
            onChange={(e) => { setFilterSemester(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Academic Year</label>
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g., 2024/2025"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading enrollments..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Student ID</th>
                <th className="p-3">Student</th>
                <th className="p-3">Course</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Year</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{e.student?.studentId || "—"}</td>
                  <td className="p-3">
                    <div>{e.student?.firstName} {e.student?.lastName}</div>
                    <div className="text-xs text-slate-400">{e.student?.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{e.course?.code}</div>
                    <div className="text-xs text-slate-400">{e.course?.name}</div>
                  </td>
                  <td className="p-3">{e.semester}</td>
                  <td className="p-3">{e.academicYear}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded capitalize
                      ${e.status === "enrolled" ? "bg-green-100 text-green-700" :
                        e.status === "completed" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"}`}>
                      {e.status || "enrolled"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setConfirmDelete(e)}
                      title="Unenroll"
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!enrollments.length && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No enrollments found. Click "Enroll Student" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between p-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {pages}</span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Single Enroll Modal */}
      {showEnroll && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleEnroll} className="bg-white rounded-xl p-6 max-w-lg w-full my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Enroll Student</h3>
              <button type="button" onClick={() => setShowEnroll(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student *</label>
              <select
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={enrollForm.student}
                onChange={(e) => setEnrollForm({ ...enrollForm, student: e.target.value })}
              >
                <option value="">Select student...</option>
                {studentOptions.map((s) => (
                  <option key={s._id} value={s._id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
              <select
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={enrollForm.course}
                onChange={(e) => {
                  const selected = courses.find((c) => c._id === e.target.value);
                  setEnrollForm({
                    ...enrollForm,
                    course: e.target.value,
                    semester: selected?.semester || 1,
                    academicYear: selected?.academicYear || "2024/2025",
                  });
                }}
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} · {c.name} (Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={enrollForm.semester}
                  onChange={(e) => setEnrollForm({ ...enrollForm, semester: +e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={enrollForm.academicYear}
                  onChange={(e) => setEnrollForm({ ...enrollForm, academicYear: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEnroll(false)} className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Bulk Enroll Students</h3>
              <button onClick={() => setShowBulk(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course *</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={bulkCourse}
                onChange={(e) => setBulkCourse(e.target.value)}
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code} · {c.name}</option>
                ))}
              </select>
            </div>

            {bulkCourse && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {loadingAvailable
                      ? "Loading students..."
                      : `${availableStudents.length} available students`}
                  </span>
                  {availableStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {selectedStudents.size === availableStudents.length ? "Unselect all" : "Select all"}
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
                  {loadingAvailable ? (
                    <div className="p-6 text-center text-slate-400 text-sm">Loading...</div>
                  ) : availableStudents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      All students are already enrolled in this course.
                    </div>
                  ) : (
                    availableStudents.map((s) => (
                      <label
                        key={s._id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(s._id)}
                          onChange={() => toggleStudent(s._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {s.studentId} · {s.firstName} {s.lastName}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {s.email} · {s.department?.name || "—"}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {selectedStudents.size} selected
                </p>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowBulk(false); setBulkCourse(""); setSelectedStudents(new Set()); setAvailableStudents([]); }}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEnroll}
                disabled={bulkSaving || !bulkCourse || selectedStudents.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {bulkSaving ? "Enrolling..." : `Enroll ${selectedStudents.size} Student${selectedStudents.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Remove Enrollment?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Unenroll <strong>{confirmDelete.student?.firstName} {confirmDelete.student?.lastName}</strong>
              {" "}from <strong>{confirmDelete.course?.code}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg">
                Cancel
              </button>
              <button onClick={doDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}