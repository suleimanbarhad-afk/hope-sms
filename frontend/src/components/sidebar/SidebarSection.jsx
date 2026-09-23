import SidebarItem from "./SidebarItem";

export default function SidebarSection({ section, items, isCollapsed, onNavigate }) {
  return (
    <div className="mb-4 last:mb-0">
      {!isCollapsed && (
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {section}
        </div>
      )}

      {isCollapsed && (
        <div className="my-2 mx-3 border-t border-slate-200" aria-hidden="true" />
      )}

      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <SidebarItem item={item} isCollapsed={isCollapsed} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}