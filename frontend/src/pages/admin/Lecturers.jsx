import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { UserPlus, X, Trash2, Power } from "lucide-react";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "Lecturer@123",
  phone: "",
  gender: "male",
  designation: "Lecturer",
  officeRoom: "",
  specialization: "",
  qualifications: "",
  joiningDate: "",
};

export default function AdminLecturers() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/lecturers", { params: { search, page, limit: 10 } })
      .then((r) => {
        setLecturers(r.data.data);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [search, page]);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (form.phone) {
      const cleaned = form.phone.replace(/^\+/, "");
      if (!/^\d+$/.test(cleaned)) {
        toast.error("Phone must contain only digits");
        return;
      }
      if (cleaned.length < 7 || cleaned.length > 15) {
        toast.error("Phone must be 7–15 digits");
        return;
      }
    }

    if (form.joiningDate) {
      const d = new Date(form.joiningDate);
      const year = d.getFullYear();
      const today = new Date();
      if (isNaN(d.getTime())) {
        toast.error("Invalid joining date");
        return;
      }
      if (year < 1950) {
        toast.error("Joining year must be 1950 or later");
        return;
      }
      if (d > today) {
        toast.error("Joining date cannot be in the future");
        return;
      }
    }

    try {
      setSaving(true);
      await api.post("/auth/register-lecturer", form);
      toast.success("Lecturer created");
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lecturer");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    await api.put(`/lecturers/${id}/status`);
    toast.success("Status updated");
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/lecturers/${confirmDelete._id}`);
      toast.success("Lecturer deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Lecturers</h1>
        <div className="flex gap-2">
          <input
            className="w-full sm:max-w-xs border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Search name, email, staff ID..."
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
            Add Lecturer
          </button>
        </div>
      </div>

      {loading ? (
        <Loader text="Loading lecturers..." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Staff ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map((l) => (
                <tr key={l._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{l.staffId || "—"}</td>
                  <td className="p-3">
                    {l.firstName} {l.lastName}
                  </td>
                  <td className="p-3">{l.email}</td>
                  <td className="p-3">{l.designation || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-1 rounded capitalize ${
                        l.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => toggleStatus(l._id)}
                      title="Toggle status"
                      className="text-yellow-600"
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(l)}
                      title="Delete"
                      className="text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!lecturers.length && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No lecturers found.
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

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={handleAdd}
              className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Add New Lecturer</h3>
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
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
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
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
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
                    value={form.phone}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^\d+]/g, "");
                      if (v.startsWith("+")) {
                        v = "+" + v.slice(1).replace(/\+/g, "");
                      } else {
                        v = v.replace(/\+/g, "");
                      }
                      setForm({ ...form, phone: v });
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Digits only, optional leading +.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="Senior Lecturer"
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Office Room
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.officeRoom}
                    onChange={(e) =>
                      setForm({ ...form, officeRoom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialization
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.specialization}
                    onChange={(e) =>
                      setForm({ ...form, specialization: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Qualifications
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="PhD in Computer Science"
                    value={form.qualifications}
                    onChange={(e) =>
                      setForm({ ...form, qualifications: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    min="1950-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm({ ...form, joiningDate: e.target.value })
                    }
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Between 1950 and today.
                  </p>
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
                  {saving ? "Creating..." : "Create Lecturer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Delete Lecturer?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to delete {confirmDelete.firstName}{" "}
              {confirmDelete.lastName}?
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