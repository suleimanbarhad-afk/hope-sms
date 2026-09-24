import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function Header({ onOpenMobileSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>

          <div>
            <h2 className="font-semibold text-slate-800">
              Welcome, {user?.firstName}
            </h2>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {user?.firstName?.[0]}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="text-slate-500 hover:text-red-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}