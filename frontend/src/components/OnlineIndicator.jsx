import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

export default function OnlineIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Wait for the socket to exist (in case it connects after mount)
    let interval = null;

    const attach = () => {
      const socket = getSocket();
      if (!socket) return false;

      const handler = (n) => setCount(n);
      socket.on("users:online", handler);

      // Ask the server for the current count (in case we missed the initial event)
      socket.emit("users:online:get");

      // Cleanup handler
      interval = () => {
        socket.off("users:online", handler);
      };
      return true;
    };

    // Try immediately; if socket not ready, poll every 500ms
    if (!attach()) {
      const timer = setInterval(() => {
        if (attach()) clearInterval(timer);
      }, 500);
      return () => {
        clearInterval(timer);
        if (typeof interval === "function") interval();
      };
    }

    return () => {
      if (typeof interval === "function") interval();
    };
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>{count} online</span>
    </div>
  );
}