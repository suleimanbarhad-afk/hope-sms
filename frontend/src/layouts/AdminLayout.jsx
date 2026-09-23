import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/sidebar/Sidebar";
import MobileSidebar from "../components/sidebar/MobileSidebar";
import useSidebar from "../hooks/useSidebar";

export default function AdminLayout() {
  const {
    isCollapsed,
    toggleCollapse,
    isMobileOpen,
    openMobile,
    closeMobile,
  } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div
        className={`
          hidden md:block fixed top-0 left-0 h-screen z-30
          transition-[width] duration-300
          ${isCollapsed ? "w-[76px]" : "w-[272px]"}
        `}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile drawer */}
      <MobileSidebar
        open={isMobileOpen}
        onClose={closeMobile}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content */}
      <div
        className={`
          transition-[margin] duration-300
          md:ml-[272px]
          ${isCollapsed ? "md:!ml-[76px]" : ""}
        `}
      >
        <Header onOpenMobileSidebar={openMobile} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}