import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  CheckCircle, XCircle, Search, Eye, X, DollarSign,
  Users, AlertCircle, Clock, TrendingUp, Receipt, Plus,
} from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function AdminFees() {
  const [tab, setTab] = useState("pending"); // pending | balances

  // Pending payments
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Student balances
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Record on behalf modal
  const [showRecord, setShowRecord] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [recordForm, setRecordForm] = useState({
    student: "",
    amount: "",
    reference: "",
    method: "cash",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [recording, setRecording] = useState(false);

  // ---- Load payments ----
  const loadPayments = () => {
    setLoadingPayments(true);
    const params = { limit: 100 };
    if (paymentSearch) params.search = paymentSearch;
    if (paymentStatus) params.status = paymentStatus;

    api
      .get("/fees/payments", { params })
      .then((r) => setPayments(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingPayments(false));
  };

  useEffect(() => {
    loadPayments();
    /* eslint-disable-next-line */
  }, [paymentSearch, paymentStatus]);

  // ---- Load student balances ----
  const loadStudents = () => {
    setLoadingStudents(true);
    const params = {};
    if (balanceFilter !== "all") params.filter = balanceFilter;

    api
      .get("/fees/statuses", { params })
      .then((r) => {
        setStudents(r.data.data || []);
        setSummary(r.data.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    loadStudents();
    /* eslint-disable-next-line */
  }, [balanceFilter]);

  // Filter students client-side by search
  const filteredStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      `${s.student.firstName} ${s.student.lastName} ${s.student.studentId} ${s.student.email}`
        .toLowerCase()
        .includes(q)
    );
  });

  // ---- Approve payment ----
  const approve = async (id) => {
    if (!confirm("Approve this payment?")) return;
    try {
      setProcessing(true);
      await api.put(`/fees/payments/${id}/approve`);
      toast.success("Payment approved");
      loadPayments();
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  // ---- Reject payment ----
  const doReject = async () => {
    if (!rejectTarget) return;
    try {
      setProcessing(true);
      await api.put(`/fees/payments/${rejectTarget._id}/reject`, {
        reason: rejectReason || "Rejected by admin",
      });
      toast.success("Payment rejected");
      setRejectTarget(null);
      setRejectReason("");
      loadPayments();
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  // ---- Open record payment modal ----
  const openRecord = async () => {
    setShowRecord(true);
    setRecordForm({
      student: "",
      amount: "",
      reference: `ADMIN-${Date.now()}`,
      method: "cash",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    if (studentList.length === 0) {
      try {
        const r = await api.get("/students?limit=500");
        setStudentList(r.data.data || []);
      } catch {}
    }
  };

  // ---- Record on behalf ----
  const handleRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.student) return toast.error("Select student");
    try {
      setRecording(true);
      await api.post("/fees/payments/admin", {
        ...recordForm,
        amount: Number(recordForm.amount),
      });
      toast.success("Payment recorded");
      setShowRecord(false);
      loadPayments();
      loadStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRecording(false);
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return map[s] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fees Management</h1>
          <p className="text-sm text-slate-500">
            Verify student payments, track who owes what, and record offline payments.
          </p>
        </div>
        <button
          onClick={openRecord}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
        >
          <Plus size={16} />
          Record on Behalf
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500">Total Required</p>
            <p className="text-2xl font-bold">{fmt(summary.totalRequired)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500">Collected</p>
            <p className="text-2xl font-bold text-green-600">
              {fmt(summary.totalCollected)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">
              {fmt(summary.totalOutstanding)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <p className="text-sm text-slate-500">Students</p>
            <div className="flex gap-1 mt-1 text-xs flex-wrap">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                {summary.owes} owe
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                {summary.paidUp} paid
              </span>
              {summary.credit > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {summary.credit} credit
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 text-sm font-medium transition -mb-px ${
            tab === "pending"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Receipt size={15} />
            Payments
            {payments.filter((p) => p.status === "pending").length > 0 && (
              <span className="bg-yellow-500 text-white text-[10px] px-1.5 rounded-full">
                {payments.filter((p) => p.status === "pending").length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("balances")}
          className={`px-4 py-2 text-sm font-medium transition -mb-px ${
            tab === "balances"
              ? "border-b-2 border-blue-600 text-blue-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Users size={15} />
            Student Balances
          </span>
        </button>
      </div>

      {/* =============== TAB 1: PAYMENTS =============== */}
      {tab === "pending" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Search by student name, ID, or reference..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loadingPayments ? (
            <Loader text="Loading payments..." />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="p-3">Student</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Year/Sem</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-b hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium">
                          {p.student?.firstName} {p.student?.lastName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {p.student?.studentId}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">{fmt(p.amount)}</td>
                      <td className="p-3 font-mono text-xs">{p.reference}</td>
                      <td className="p-3 capitalize text-xs">
                        {p.method?.replace("_", " ")}
                      </td>
                      <td className="p-3 text-xs">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-xs">
                        Y{p.year} · S{p.semester}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-xs px-2 py-1 rounded capitalize ${statusBadge(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.status === "pending" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => approve(p._id)}
                              disabled={processing}
                              className="flex items-center gap-1 text-xs text-green-700 hover:bg-green-50 px-2 py-1 rounded disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(p)}
                              disabled={processing}
                              className="flex items-center gap-1 text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        )}
                        {p.status !== "pending" && (
                          <span className="text-xs text-slate-400">
                            {p.verifiedBy
                              ? `by ${p.verifiedBy.firstName}`
                              : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!payments.length && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =============== TAB 2: BALANCES =============== */}
      {tab === "balances" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="owes">Owes Money</option>
              <option value="unpaid">Fully Unpaid</option>
              <option value="paid">Paid Up</option>
              <option value="credit">Has Credit</option>
              <option value="pending">Has Pending Payment</option>
            </select>
          </div>

          {loadingStudents ? (
            <Loader text="Loading balances..." />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="p-3">Student</th>
                    <th className="p-3 text-right">Required</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Pending</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const isOwes = s.balance < 0;
                    const isCredit = s.balance > 0;
                    return (
                      <tr key={s.student._id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-medium">
                            {s.student.firstName} {s.student.lastName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {s.student.studentId} · Y{s.year} S{s.semester}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {fmt(s.requiredAmount)}
                        </td>
                        <td className="p-3 text-right text-green-700">
                          {fmt(s.paidAmount)}
                        </td>
                        <td className="p-3 text-right">
                          {s.pendingAmount > 0 ? (
                            <span className="text-yellow-700">
                              {fmt(s.pendingAmount)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {isOwes ? (
                            <span className="text-red-600">
                              -{fmt(Math.abs(s.balance))}
                            </span>
                          ) : isCredit ? (
                            <span className="text-blue-600">
                              +{fmt(s.balance)}
                            </span>
                          ) : (
                            <span className="text-green-600">$0.00</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2 py-1 rounded capitalize font-medium ${
                              s.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : s.status === "credit"
                                ? "bg-blue-100 text-blue-700"
                                : s.status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredStudents.length && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =============== REJECT MODAL =============== */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg">Reject Payment</h3>
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <p>
                <span className="text-slate-500">Student:</span>{" "}
                {rejectTarget.student?.firstName}{" "}
                {rejectTarget.student?.lastName}
              </p>
              <p>
                <span className="text-slate-500">Amount:</span>{" "}
                {fmt(rejectTarget.amount)}
              </p>
              <p>
                <span className="text-slate-500">Reference:</span>{" "}
                {rejectTarget.reference}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="e.g., Transaction ID not found in bank statement"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={doReject}
                disabled={processing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== RECORD ON BEHALF MODAL =============== */}
      {showRecord && (
        <div className="fixed inset-0 bg-black/40 z-[100] overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <form
              onSubmit={handleRecord}
              className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Record Payment</h3>
                  <p className="text-xs text-slate-500">
                    Admin entries are auto-approved
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecord(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Student *
                </label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={recordForm.student}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, student: e.target.value })
                  }
                >
                  <option value="">Select student...</option>
                  {studentList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.studentId} · {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
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
                    value={recordForm.amount}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, amount: e.target.value })
                    }
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
                    value={recordForm.paymentDate}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        paymentDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reference *
                </label>
                <input
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm"
                  value={recordForm.reference}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, reference: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Method
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  value={recordForm.method}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, method: e.target.value })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
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
                  value={recordForm.notes}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecord(false)}
                  className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {recording ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}