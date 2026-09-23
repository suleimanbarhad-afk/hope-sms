import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import api from "../services/api";

export default function FeeBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api
      .get("/fees/my")
      .then((r) => setStatus(r.data?.current))
      .catch(() => {});
  }, []);

  if (dismissed || !status) return null;

  const balance = status.balance || 0;
  if (balance >= 0) return null; // paid or credit — no banner

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 text-sm text-red-800">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <p className="font-medium">
              Your Semester {status.semester} fee is unpaid (
              {status.balance < 0 ? `you owe $${Math.abs(balance)}` : ""})
            </p>
            <p className="text-xs">
              Pay to Hope Secondary School to regain access to courses and results.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/student/fees"
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap"
          >
            Pay Now
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-700 text-lg leading-none px-2"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}