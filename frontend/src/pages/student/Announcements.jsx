import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

const priorityColors = {
  normal: "bg-slate-100 text-slate-700",
  important: "bg-yellow-100 text-yellow-800",
  urgent: "bg-red-100 text-red-700",
};

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements").then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <div className="space-y-4">
        {items.map((a) => (
          <div key={a._id} className="card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold">{a.title}</h3>
              <span className={`text-xs px-2 py-1 rounded capitalize ${priorityColors[a.priority]}`}>
                {a.priority}
              </span>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-line">{a.description}</p>
            <p className="text-xs text-slate-400 mt-3">
              By {a.author?.firstName} {a.author?.lastName} ·{" "}
              {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {!items.length && <p className="text-slate-400">No announcements yet.</p>}
      </div>
    </div>
  );
}