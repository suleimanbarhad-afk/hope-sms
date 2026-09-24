import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import {
  Bell, Check, CheckCheck, Trash2, Megaphone, GraduationCap,
  CreditCard, ClipboardList, AlertCircle, Bell as BellIcon,
} from "lucide-react";

const ICON_BY_TYPE = {
  announcement: Megaphone,
  result: GraduationCap,
  fee: CreditCard,
  assignment: ClipboardList,
  attendance: AlertCircle,
  general: BellIcon,
};

const COLOR_BY_TYPE = {
  announcement: "bg-purple-100 text-purple-600",
  result: "bg-blue-100 text-blue-600",
  fee: "bg-green-100 text-green-600",
  assignment: "bg-yellow-100 text-yellow-600",
  attendance: "bg-red-100 text-red-600",
  general: "bg-slate-100 text-slate-600",
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    setLoading(true);
    const params = filter === "unread" ? { unread: "true" } : {};
    api
      .get("/notifications", { params })
      .then((r) => {
        setNotifications(r.data.notifications || []);
        setUnread(r.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    /* eslint-disable-next-line */
  }, [filter]);

  const markOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      toast.error("Failed");
    }
  };

  const markAll = async () => {
    try {
      const r = await api.put("/notifications/read-all");
      toast.success(r.data.message);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      toast.error("Failed");
    }
  };

  const remove = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this notification?")) return;
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Failed");
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL notifications? This cannot be undone.")) return;
    try {
      const r = await api.delete("/notifications");
      toast.success(r.data.message);
      setNotifications([]);
      setUnread(0);
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleClick = (n) => {
    if (!n.read) markOne(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs rounded ${
                filter === "all" ? "bg-white shadow-sm font-medium" : "text-slate-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 text-xs rounded ${
                filter === "unread" ? "bg-white shadow-sm font-medium" : "text-slate-600"
              }`}
            >
              Unread
            </button>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
            >
              <CheckCheck size={13} /> Mark all
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg"
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Bell className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-slate-600 font-medium">No notifications</p>
          <p className="text-slate-400 text-sm">
            {filter === "unread" ? "All caught up!" : "You'll see notifications here."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICON_BY_TYPE[n.type] || BellIcon;
            const color = COLOR_BY_TYPE[n.type] || "bg-slate-100 text-slate-600";
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition flex gap-3 ${
                  !n.read ? "border-blue-200 bg-blue-50/30" : "border-slate-100"
                }`}
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !n.read ? "font-semibold text-slate-800" : "text-slate-700"
                      }`}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-1">
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markOne(n._id);
                      }}
                      title="Mark as read"
                      className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => remove(n._id, e)}
                    title="Delete"
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}