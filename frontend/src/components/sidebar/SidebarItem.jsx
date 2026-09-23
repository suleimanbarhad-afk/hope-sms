import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck, CalendarCheck,
  Megaphone, CreditCard, User, Bell, Building2, GraduationCap,
  CalendarDays, ClipboardList, FileText, BarChart3, Settings,
  DollarSign, UserPlus, CheckCircle,
} from "lucide-react";

// Icon registry — new icons go here
const ICONS = {
  LayoutDashboard, Users, BookOpen, ClipboardCheck, CalendarCheck,
  Megaphone, CreditCard, User, Bell, Building2, GraduationCap,
  CalendarDays, ClipboardList, FileText, BarChart3, Settings,
  DollarSign, UserPlus, CheckCircle,
};

export default function SidebarItem({ item, isCollapsed, onNavigate }) {
  const Icon = ICONS[item.icon] || LayoutDashboard;

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
      aria-label={item.label}
      className={({ isActive }) =>
        `
        group relative flex items-center gap-3 mx-1 px-3 py-2.5 rounded-lg
        text-sm font-medium transition-colors duration-150
        ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }
        ${isCollapsed ? "justify-center" : ""}
        `
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-blue-600"
              aria-hidden="true"
            />
          )}

          <Icon
            size={18}
            className={isActive ? "text-blue-600 shrink-0" : "shrink-0"}
          />

          {!isCollapsed && <span className="truncate">{item.label}</span>}

          {isCollapsed && (
            <span
              role="tooltip"
              className="
                pointer-events-none absolute left-full ml-2 z-50
                whitespace-nowrap rounded-md bg-slate-900 px-2 py-1
                text-xs text-white opacity-0 group-hover:opacity-100
                transition-opacity duration-150
              "
            >
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}