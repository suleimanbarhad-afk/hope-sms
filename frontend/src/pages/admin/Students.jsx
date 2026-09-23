import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { Trash2, Power, KeyRound, UserPlus, X, Pencil } from "lucide-react";

const EMPTY_ADD = {
  firstName: "",
  lastName: "",
  email: "",
  password: "Student@123",
  phone: "",
  gender: "male",
  dateOfBirth: "",
  yearOfStudy: 1,
  semester: 1,
};

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const load = () => {
    setLoading(true);
    api
      .get("/students", { params: { search, page, limit: 10 } })
      .then((r) => {
        setStudents(r.data.data);
        setPages(r.data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [search, page]);

  const toggleStatus = async (id) => {
    await api.put(`/students/${id}/status`);
    toast.success("Status updated");
    load();
  };

  const resetPassword = async (id) => {
    if (!confirm("Reset password to default 'Student@123'?")) return;
    await api.put(`/students/${id}/reset-password`, { newPassword: "Student@123" });
    toast.success("Password reset to Student@123");
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    await api.delete(`/students/${confirmDelete._id}`);
    toast.success("Student deleted");
    setConfirmDelete(null);
    load();
  };

  // Validate phone
  const checkPhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/^\+/, "");
    if (!/^\d+$/.test(cleaned)) return "Phone must contain only digits";
    if (cleaned.length < 7 || cleaned.length > 15)
      return "Phone must be 7–15 digits";
    return null;
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const phoneError = checkPhone(addForm.phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    try {
      setSaving(true);
      await api.post("/auth/register", addForm);
      toast.success("Student created");
      setShowAdd(false);
      setAddForm(EMPTY_ADD);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s) => {
    setEditing(s);
    setEditForm({
      firstName: s.firstName || "",
      lastName: s.lastName || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    const phoneError = checkPhone(editForm.phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/students/${editing._id}`, editForm);
      toast.success("Student updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Students</h1>
        <div className="flex gap-2">
          <input
            className="w-full sm:max-w-xs border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            <UserPlus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {loading ? (
        <Loader text="Loading students..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Student ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Year</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{s.studentId}</td>
                  <td className="p-3">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{s.phone || "—"}</td>
                  <td className="p-3">{s.yearOfStudy}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        title="Edit"
                        className="text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => toggleStatus(s._id)}
                        title="Toggle status"
                        className="text-yellow-600"
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => resetPassword(s._id)}
                        title="Reset password"
                        className="text-purple-600"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        title="Delete"
                        className="text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No students found.
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
            <span className="text-sm text-slate-500">
              Page {page} of {pages}
            </span>
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

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete {confirmDelete.firstName}{" "}
              {confirmDelete.lastName}? This cannot be undone.
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

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={handleAdd}
              className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Add New Student</h3>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.firstName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.lastName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="+255712345678"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.phone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^\d+]/g, "");
                      if (v.startsWith("+"))
                        v = "+" + v.slice(1).replace(/\+/g, "");
                      else v = v.replace(/\+/g, "");
                      setAddForm({ ...addForm, phone: v });
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Digits only.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.gender}
                    onChange={(e) =>
                      setAddForm({ ...addForm, gender: e.target.value })
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.dateOfBirth}
                    onChange={(e) =>
                      setAddForm({ ...addForm, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Year of Study
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.yearOfStudy}
                    onChange={(e) =>
                      setAddForm({ ...addForm, yearOfStudy: +e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={addForm.semester}
                    onChange={(e) =>
                      setAddForm({ ...addForm, semester: +e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={handleEditSave}
              className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Edit Student</h3>
                  <p className="text-xs text-slate-500">
                    {editing.studentId} · Admin-managed fields
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="+255712345678"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={editForm.phone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^\d+]/g, "");
                      if (v.startsWith("+"))
                        v = "+" + v.slice(1).replace(/\+/g, "");
                      else v = v.replace(/\+/g, "");
                      setEditForm({ ...editForm, phone: v });
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">Digits only.</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                Students cannot change these fields themselves. Only admins can.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}