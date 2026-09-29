import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import { Video, Users, Clock } from "lucide-react";

export default function LiveClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/video/live")
      .then((r) => setClasses(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading && classes.length === 0)
    return <Loader text="Loading live classes..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-sm text-slate-500">
          Join ongoing video classes (auto-refreshes every 15 seconds)
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Video className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-slate-600 font-medium">No live classes right now</p>
          <p className="text-slate-400 text-sm">
            Check back later or ask your lecturer
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    {c.course?.code} · {c.course?.name}
                  </p>
                </div>
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {c.participants?.length || 0} in room
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Started {new Date(c.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <Link
                to={`/student/video/${c._id}`}
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg"
              >
                Join Class
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}