import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "unimanage_sidebar_collapsed";

export default function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = useCallback(() => setIsCollapsed((c) => !c), []);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  return { isCollapsed, toggleCollapse, isMobileOpen, openMobile, closeMobile };
}