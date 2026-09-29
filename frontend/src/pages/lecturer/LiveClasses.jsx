import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { Video, Plus, Users, Clock, Play, X, StopCircle } from "lucide-react";

export default function LecturerLiveClasses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [starting, setStarting] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [coursesRes, liveRes] = await Promise.all([
        api.get("/lecturer/courses"),
        api.get("/video/live"),
      ]);
      setCourses(coursesRes.data || []);
      setLiveClasses(liveRes.data || []);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      api.get("/video/live").then((r) => setLiveClasses(r.data || []));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const startClass = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title.trim()) {
      toast.error("Select a course and enter a title");
      return;
    }

    try {
      setStarting(true);
      const res = await api.post("/video/start", form);
      const roomId = res.data.room._id;

      toast.success("Class started! Redirecting to video room...");
      setShowStartModal(false);
      setForm({ courseId: "", title: "" });

      // Redirect to video room
      navigate(`/lecturer/video/${roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start class");
    } finally {
      setStarting(false);
    }
  };

  const endClass = async (roomId) => {
    if (!confirm("End this class for everyone?")) return;
    try {
      await api.put(`/video/end/${roomId}`);
      toast.success("Class ended");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end class");
    }
  };

  if (loading) return <Loader text="Loading live classes..." />;

  // Filter live classes to only this lecturer's
  const myLiveClasses = liveClasses.filter((c) => c.course);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live Classes</h1>
          <p className="text-sm text-slate-500">
            Start or manage video classes for your courses
          </p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
        >
          <Plus size={16} />
          Start New Class
        </button>
      </div>

      {/* Currently Live */}
      {myLiveClasses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Currently Live
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myLiveClasses.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-5"
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

                <div className="flex gap-2">
                  <Link
                    to={`/lecturer/video/${c._id}`}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg"
                  >
                    <Play size={14} /> Join
                  </Link>
                  <button
                    onClick={() => endClass(c._id)}
                    className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-lg"
                  >
                    <StopCircle size={14} /> End
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Courses */}
      <div>
        <h2 className="text-lg font-semibold mb-3">My Courses</h2>
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Video className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500">
              No courses assigned. Contact admin to assign you to courses.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{c.code}</p>
                    <p className="text-xs text-slate-500">{c.name}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {c.creditHours} cr
                  </span>
                </div>
                <button
                  onClick={() => {
                    setForm({ courseId: c._id, title: `Live Session — ${c.code}` });
                    setShowStartModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm py-2 rounded-lg"
                >
                  <Video size={14} />
                  Start Live Class
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Class Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={startClass}
            className="bg-white rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Start Live Class</h3>
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Course *
              </label>
              <select
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={form.courseId}
                onChange={(e) => {
                  const selected = courses.find((c) => c._id === e.target.value);
                  setForm({
                    courseId: e.target.value,
                    title: selected ? `Live Session — ${selected.code}` : form.title,
                  });
                }}
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Class Title *
              </label>
              <input
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="e.g., Introduction to Programming — Week 3"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              ℹ️ Your students enrolled in this course will see this class and
              can join. Attendance will be marked automatically.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={starting || !form.courseId || !form.title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {starting ? "Starting..." : "Start Class"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}