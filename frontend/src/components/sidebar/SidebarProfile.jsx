import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useClickOutside from "../../hooks/useClickOutside";

export default function SidebarProfile({ isCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useClickOutside(menuRef, () => setOpen(false), open);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "U";

  const profilePath =
    user?.role === "admin" ? "/admin/profile" : "/student/profile";
  const settingsPath =
    user?.role === "admin" ? "/admin/settings" : "/student/settings";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`
          w-full flex items-center gap-3 px-2 py-2 rounded-lg
          hover:bg-slate-100 transition-colors text-left
          ${isCollapsed ? "justify-center" : ""}
        `}
      >
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shrink-0">
          {initials.toUpperCase()}
        </div>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-slate-500 capitalize truncate">
                {user?.role}
              </div>
            </div>
            <MoreVertical size={16} className="text-slate-400 shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`
            absolute z-50 mb-1 w-52 bg-white border border-slate-200
            rounded-lg shadow-lg py-1
            ${isCollapsed ? "left-full ml-2 bottom-0" : "bottom-full left-2 right-2 mb-2"}
          `}
        >
          <button
            role="menuitem"
            onClick={() => go(profilePath)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <User size={15} /> My Profile
          </button>

          <button
            role="menuitem"
            onClick={() => go(settingsPath)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Settings size={15} /> Settings
          </button>

          <div className="border-t border-slate-100 my-1" />

          <button
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}