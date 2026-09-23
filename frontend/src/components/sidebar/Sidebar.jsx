import { NavLink } from "react-router-dom";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavigation } from "../../config/navigation";
import SidebarSection from "./SidebarSection";
import SidebarProfile from "./SidebarProfile";

export default function Sidebar({ isCollapsed, onToggleCollapse, onNavigate }) {
  const { user } = useAuth();
  const navigation = getNavigation(user?.role);

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-slate-200
        transition-[width] duration-300 ease-in-out
        ${isCollapsed ? "w-[76px]" : "w-[272px]"}
        h-full
      `}
    >
      {/* Brand header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <GraduationCap className="text-white" size={20} />
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-800 leading-tight">UniManage</div>
            <div className="text-[11px] text-slate-500 leading-tight truncate">
              Student Management System
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        {navigation.map((group) => (
          <SidebarSection
            key={group.section}
            section={group.section}
            items={group.items}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Profile footer */}
      <div className="border-t border-slate-200 p-2 shrink-0">
        <SidebarProfile isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}