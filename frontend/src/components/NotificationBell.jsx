import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import useClickOutside from "../hooks/useClickOutside";
import toast from "react-hot-toast";
import {
  Bell, Check, Megaphone, GraduationCap, CreditCard,
  ClipboardList, AlertCircle, Bell as BellIcon,
} from "lucide-react";

const ICON_BY_TYPE = {
  announcement: Megaphone,
  result: GraduationCap,
  fee: CreditCard,
  assignment: ClipboardList,
  attendance: AlertCircle,
  general: BellIcon,
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setOpen(false), open);

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count || 0);
    } catch (err) {}
  };

  useEffect(() => {
    fetchUnread();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onCount = (count) => setUnread(count);

    const onNew = (notif) => {
      setUnread((u) => u + 1);

      toast(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (notif.link) navigate(notif.link);
            }}
            className="cursor-pointer"
          >
            <p className="font-semibold text-sm">{notif.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
          </div>
        ),
        { duration: 5000, icon: "🔔" }
      );

      setNotifications((prev) => [notif, ...prev].slice(0, 5));
    };

    socket.on("notifications:count", onCount);
    socket.on("notification:new", onNew);

    return () => {
      socket.off("notifications:count", onCount);
      socket.off("notification:new", onNew);
    };
  }, [navigate]);

  const openDropdown = async () => {
    setOpen(!open);
    if (!open) {
      try {
        setLoading(true);
        const res = await api.get("/notifications?limit=5");
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unreadCount || 0);
      } catch (err) {}
      finally {
        setLoading(false);
      }
    }
  };

  const markOne = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {}
  };

  const openNotification = (n) => {
    if (!n.read) {
      api.put(`/notifications/${n._id}/read`).catch(() => {});
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const goToAll = () => {
    setOpen(false);
    navigate(
      user?.role === "admin"
        ? "/admin/notifications"
        : user?.role === "lecturer"
        ? "/lecturer/notifications"
        : "/student/notifications"
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={openDropdown}
        className="relative text-slate-600 hover:text-blue-600 transition p-1"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="text-xs text-blue-600">{unread} unread</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICON_BY_TYPE[n.type] || BellIcon;
                return (
                  <div
                    key={n._id}
                    onClick={() => openNotification(n)}
                    className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 transition ${
                      !n.read ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        !n.read
                          ? "bg-blue-100 text-blue-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !n.read
                            ? "font-semibold text-slate-800"
                            : "text-slate-700"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => markOne(n._id, e)}
                        className="shrink-0 self-start text-blue-600 hover:bg-blue-50 rounded p-1"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 p-2 flex justify-between">
            <button
              onClick={goToAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
            >
              View all
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}