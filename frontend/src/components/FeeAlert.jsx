import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import api from "../services/api";

export default function FeeAlert() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/fees/my")
      .then((r) => setStatus(r.data?.current))
      .catch(() => {});
  }, []);

  if (!status) return null;

  const balance = status.balance || 0;

  // Paid or credit — show a subtle green card
  if (balance >= 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 className="text-green-600" size={22} />
        <div className="flex-1 text-sm text-green-900">
          <p className="font-medium">Fees paid for this semester</p>
          <p className="text-xs text-green-700">
            {balance > 0
              ? `You have $${balance.toFixed(2)} credit for next semester.`
              : "You're all caught up. Thank you!"}
          </p>
        </div>
        <Link
          to="/student/fees"
          className="text-xs text-green-700 hover:underline"
        >
          View details →
        </Link>
      </div>
    );
  }

  // Owes — red alert
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
      <AlertCircle className="text-red-600" size={22} />
      <div className="flex-1 text-sm text-red-900">
        <p className="font-medium">
          You owe ${Math.abs(balance).toFixed(2)} for Semester {status.semester}
        </p>
        <p className="text-xs text-red-700">
          Pay to Hope Secondary School to access courses and results.
        </p>
      </div>
      <Link
        to="/student/fees"
        className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded whitespace-nowrap"
      >
        <CreditCard size={13} />
        Pay Now
      </Link>
    </div>
  );
}