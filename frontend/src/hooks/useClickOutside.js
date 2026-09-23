import { useEffect } from "react";

export default function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref?.current) return;

    const onClick = (e) => {
      if (!ref.current.contains(e.target)) handler();
    };
    const onKey = (e) => {
      if (e.key === "Escape") handler();
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, handler, enabled]);
}