import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  DollarSign, Upload, X, AlertCircle, CheckCircle, Clock,
  XCircle, Receipt, Building2, Smartphone, Calendar,
} from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function StudentFees() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    reference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "mobile_money",
    notes: "",
    receiptImage: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/fees/my")
      .then((r) => setData(r.data))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load fees")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openPay = () => {
    const balance = data?.current?.balance || 0;
    const required = data?.current?.requiredAmount || 0;
    const paid = data?.current?.paidAmount || 0;
    // Suggest remaining amount
    const suggested = Math.max(0, required - paid);
    setForm({
      amount: suggested ? suggested.toString() : "",
      reference: "",
      paymentDate: new Date().toISOString().split("T")[0],
      method: "mobile_money",
      notes: "",
      receiptImage: "",
    });
    setReceiptFile(null);
    setShowPayModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      return toast.error("Enter a valid amount");
    }
    if (!form.reference.trim()) {
      return toast.error("Transaction reference is required");
    }

    try {
      setSubmitting(true);

      // If receipt uploaded, we'd send it via FormData.
      // For now, keep it text-only and store the reference.
      // (File upload can be added later with multer.)
      await api.post("/fees/my/payment", {
        amount: Number(form.amount),
        reference: form.reference,
        paymentDate: form.paymentDate,
        method: form.method,
        notes: form.notes,
      });

      toast.success("Payment recorded — waiting for admin verification");
      setShowPayModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading your fees..." />;
  if (!data) return <p className="text-slate-500">Failed to load.</p>;

  const { current, bankInfo, payments, gracePeriodDays, semesterStartDate } = data;

  const balanceStatus =
    current.balance > 0 ? "credit" : current.balance < 0 ? "owes" : "paid";

  const statusBadge = (status) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  const statusIcon = (status) => {
    if (status === "approved") return <CheckCircle size={14} />;
    if (status === "rejected") return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Fees</h1>
          <p className="text-sm text-slate-500">
            {current.academicYear} · Year {current.year} · Semester {current.semester}
          </p>
        </div>
        <button
          onClick={openPay}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
        >
          <Receipt size={16} />
          Record a Payment
        </button>
      </div>

      {/* Balance + Required cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div
          className={`rounded-xl shadow-sm border p-5 ${
            balanceStatus === "paid"
              ? "bg-green-50 border-green-200"
              : balanceStatus === "credit"
              ? "bg-blue-50 border-blue-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">Current Balance</p>
          <p
            className={`text-3xl font-bold mt-1 ${
              balanceStatus === "paid"
                ? "text-green-700"
                : balanceStatus === "credit"
                ? "text-blue-700"
                : "text-red-700"
            }`}
          >
            {current.balance >= 0 ? "+" : "-"}
            {fmt(Math.abs(current.balance))}
          </p>
          <p className="text-xs mt-1 capitalize text-slate-600">
            {balanceStatus === "paid" && "You're all caught up"}
            {balanceStatus === "credit" && "You have credit for next semester"}
            {balanceStatus === "owes" && "Payment required to access courses"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm font-medium text-slate-600">This Semester</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{fmt(current.requiredAmount)}</span>
            <span className="text-xs text-slate-500">required</span>
          </div>
          <p className="text-sm mt-2">
            Paid:{" "}
            <span className="font-semibold text-green-700">
              {fmt(current.paidAmount)}
            </span>
          </p>
          {current.pendingAmount > 0 && (
            <p className="text-xs text-yellow-700 mt-1">
              ⏳ {fmt(current.pendingAmount)} pending verification
            </p>
          )}
          {current.dueDate && (
            <p className="text-xs text-slate-500 mt-2">
              Due: {new Date(current.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Warning banner if blocked */}
      {balanceStatus === "owes" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={22} />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              You owe {fmt(Math.abs(current.balance))} for this semester
            </p>
            <p className="mt-1">
              Pay to regain access to courses and results.
              {gracePeriodDays > 0 && (
                <> Grace period: {gracePeriodDays} days from semester start.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* How to Pay */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-slate-500" />
          How to Pay
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2">Bank Transfer</p>
            <p>
              <span className="text-slate-500">Bank:</span>{" "}
              {bankInfo.bankName || "—"}
            </p>
            <p>
              <span className="text-slate-500">Account:</span>{" "}
              <span className="font-mono">
                {bankInfo.bankAccountNumber || "—"}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Name:</span>{" "}
              {bankInfo.bankAccountName || "—"}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Smartphone size={14} /> Mobile Money
            </p>
            <p>
              <span className="text-slate-500">Number:</span>{" "}
              {bankInfo.mobileMoneyNumber || "—"}
            </p>
            <p>
              <span className="text-slate-500">Name:</span>{" "}
              {bankInfo.mobileMoneyName || "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">Steps</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Send the amount via your mobile money or bank app</li>
            <li>
              Save the transaction ID (e.g., <code>BNK-12345</code>)
            </li>
            <li>Click "Record a Payment" and fill in the details</li>
            <li>Admin will verify within 24 hours</li>
          </ol>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          Payment History
        </h3>

        {payments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium">{fmt(p.amount)}</td>
                    <td className="p-3 font-mono text-xs">{p.reference}</td>
                    <td className="p-3 capitalize">
                      {p.method?.replace("_", " ")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded capitalize ${statusBadge(
                          p.status
                        )}`}
                      >
                        {statusIcon(p.status)}
                        {p.status}
                      </span>
                      {p.status === "rejected" && p.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          {p.rejectionReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={submitPayment}
              className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Record a Payment</h3>
                  <p className="text-xs text-slate-500">
                    After paying to the school account, enter the details here
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="text-slate-500">Year/Semester:</span>{" "}
                  {current.year} · {current.semester}
                </p>
                <p>
                  <span className="text-slate-500">Required:</span>{" "}
                  {fmt(current.requiredAmount)}
                </p>
                <p>
                  <span className="text-slate-500">Already paid:</span>{" "}
                  {fmt(current.paidAmount)}
                </p>
                <p>
                  <span className="text-slate-500">Remaining:</span>{" "}
                  <span className="font-semibold text-red-600">
                    {fmt(Math.max(0, current.requiredAmount - current.paidAmount))}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    value={form.paymentDate}
                    onChange={(e) =>
                      setForm({ ...form, paymentDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Transaction Reference *
                </label>
                <input
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  placeholder="e.g., BNK-12345 or MPESA-98765432"
                  value={form.reference}
                  onChange={(e) =>
                    setForm({ ...form, reference: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  The ID from your bank/mobile money receipt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Any extra info for the admin"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                ⏳ Your payment will be marked as <strong>pending</strong> until
                an admin verifies it against the bank statement.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}