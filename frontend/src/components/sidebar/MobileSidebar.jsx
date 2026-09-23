import Sidebar from "./Sidebar";

export default function MobileSidebar({
  open,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          fixed inset-0 bg-slate-900/50 z-40 md:hidden
          transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50 md:hidden
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          isCollapsed={false}
          onToggleCollapse={onToggleCollapse}
          onNavigate={onClose}
        />
      </div>
    </>
  );
}