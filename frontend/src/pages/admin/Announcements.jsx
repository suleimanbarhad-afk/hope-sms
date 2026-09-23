import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "normal" });

  const load = () => {
    setLoading(true);
    api.get("/announcements").then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", form);
      toast.success("Announcement created");
      setShowForm(false);
      setForm({ title: "", description: "", priority: "normal" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await api.delete(`/announcements/${id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>New Announcement</button>
      </div>

      {loading ? <Loader /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((a) => (
            <div key={a._id} className="card">
              <div className="flex justify-between gap-2 mb-2">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 capitalize">{a.priority}</span>
              </div>
              <p className="text-sm text-slate-600">{a.description}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                <button onClick={() => remove(a._id)} className="text-red-600 text-xs">Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-slate-400">No announcements yet.</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 max-w-md w-full space-y-3">
            <h3 className="font-semibold">New Announcement</h3>
            <input className="input" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea rows={4} className="input" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Publish</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}