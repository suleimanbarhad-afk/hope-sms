import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { Plus, X, Pencil, Trash2, CalendarCheck, FileCheck } from "lucide-react";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  creditHours: 3,
  semester: 1,
  academicYear: "2024/2025",
  lecturer: "",
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [coursesRes, lecturersRes] = await Promise.all([
        api.get("/courses", { params: { search, limit: 100 } }),
        api.get("/lecturers/list"),
      ]);
      setCourses(coursesRes.data.data);
      setLecturers(lecturersRes.data);
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      description: c.description || "",
      creditHours: c.creditHours,
      semester: c.semester,
      academicYear: c.academicYear || "2024/2025",
      lecturer: c.lecturer?._id || "",
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, lecturer: form.lecturer || null };
      if (editing) {
        await api.put(`/courses/${editing._id}`, payload);
        toast.success("Course updated");
      } else {
        await api.post("/courses", payload);
        toast.success("Course created");
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/courses/${confirmDelete._id}`);
      toast.success("Course deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const toggleGate = async (course, gate, currentValue) => {
    try {
      await api.put(`/courses/${course._id}/gates`, {
        [gate]: !currentValue,
      });
      toast.success(`${gate === "attendanceOpen" ? "Attendance" : "Exam"} ${!currentValue ? "opened" : "closed"}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Courses</h1>
        <div className="flex gap-2">
          <input
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Add Course
          </button>
        </div>
      </div>

      {loading ? (
        <Loader text="Loading courses..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Sem</th>
                <th className="p-3">Lecturer</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Exam</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.semester}</td>
                  <td className="p-3">
                    {c.lecturer ? (
                      <span className="text-sm">
                        {c.lecturer.firstName} {c.lecturer.lastName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleGate(c, "attendanceOpen", c.attendanceOpen)}
                      className={`flex items-center gap-1 text-xs px-3 py-1 rounded font-medium transition ${
                        c.attendanceOpen
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={c.attendanceOpen ? "Click to close" : "Click to open"}
                    >
                      <CalendarCheck size={12} />
                      {c.attendanceOpen ? "Open" : "Closed"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleGate(c, "examOpen", c.examOpen)}
                      className={`flex items-center gap-1 text-xs px-3 py-1 rounded font-medium transition ${
                        c.examOpen
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                      title={c.examOpen ? "Click to close" : "Click to open"}
                    >
                      <FileCheck size={12} />
                      {c.examOpen ? "Open" : "Closed"}
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      title="Edit"
                      className="text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c)}
                      title="Delete"
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!courses.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={save}
              className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {editing ? "Edit" : "Add"} Course
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Credit Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.creditHours}
                    onChange={(e) =>
                      setForm({ ...form, creditHours: +e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Course Name *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Assign Lecturer
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.lecturer}
                    onChange={(e) => setForm({ ...form, lecturer: e.target.value })}
                  >
                    <option value="">— Unassigned —</option>
                    {lecturers.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.firstName} {l.lastName}
                        {l.staffId ? ` · ${l.staffId}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.semester}
                    onChange={(e) =>
                      setForm({ ...form, semester: +e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.academicYear}
                    onChange={(e) =>
                      setForm({ ...form, academicYear: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Course?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Delete {confirmDelete.code} · {confirmDelete.name}?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}