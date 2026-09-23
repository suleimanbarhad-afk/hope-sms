import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Filter } from "lucide-react";

export default function AdminResultApprovals() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // "approve" | "reject" | null
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/results/pending")
      .then((r) => setResults(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === results.length) setSelected(new Set());
    else setSelected(new Set(results.map((r) => r._id)));
  };

  const approveOne = async (id) => {
    try {
      await api.put(`/results/${id}/approve`);
      toast.success("Result approved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const rejectOne = async (id) => {
    const reason = prompt("Rejection reason (optional):") || "Rejected by admin";
    try {
      await api.put(`/results/${id}/reject`, { reason });
      toast.success("Result rejected");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const runBulk = async () => {
    if (!bulkAction) return;
    if (selected.size === 0) {
      toast.error("Select at least one result");
      return;
    }
    try {
      setProcessing(true);
      const payload = {
        ids: [...selected],
        action: bulkAction,
        reason: bulkAction === "reject" ? (rejectReason || "Rejected by admin") : undefined,
      };
      const res = await api.post("/results/bulk-action", payload);
      toast.success(res.data.message);
      setSelected(new Set());
      setBulkAction(null);
      setRejectReason("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader text="Loading pending results..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Result Approvals</h1>
          <p className="text-sm text-slate-500">
            {results.length} pending result{results.length !== 1 ? "s" : ""} awaiting review
          </p>
        </div>

        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setBulkAction("approve")}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <CheckCircle size={16} />
              Approve {selected.size}
            </button>
            <button
              onClick={() => setBulkAction("reject")}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <XCircle size={16} />
              Reject {selected.size}
            </button>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={44} />
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm">No pending results to review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === results.length && results.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="p-3">Student</th>
                <th className="p-3">Course</th>
                <th className="p-3">A</th>
                <th className="p-3">C</th>
                <th className="p-3">T</th>
                <th className="p-3">E</th>
                <th className="p-3">Total</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Entered By</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r._id} className="border-b hover:bg-slate-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r._id)}
                      onChange={() => toggleSelect(r._id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.student?.firstName} {r.student?.lastName}</div>
                    <div className="text-xs text-slate-400">{r.student?.studentId}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{r.course?.code}</div>
                    <div className="text-xs text-slate-400 truncate">{r.course?.name}</div>
                  </td>
                  <td className="p-3">{r.assignmentMarks}</td>
                  <td className="p-3">{r.courseworkMarks}</td>
                  <td className="p-3">{r.testMarks}</td>
                  <td className="p-3">{r.examMarks}</td>
                  <td className="p-3 font-semibold">{r.totalMarks}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                      {r.grade}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">
                      {r.enteredBy?.firstName} {r.enteredBy?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {r.enteredBy?.role}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => approveOne(r._id)}
                        title="Approve"
                        className="text-green-600 hover:bg-green-50 p-1 rounded"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => rejectOne(r._id)}
                        title="Reject"
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk action modal */}
      {bulkAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-lg capitalize">
              {bulkAction} {selected.size} Result{selected.size !== 1 ? "s" : ""}
            </h3>

            {bulkAction === "reject" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rejection reason (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Why are these results being rejected?"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            {bulkAction === "approve" && (
              <p className="text-sm text-slate-500">
                These results will become visible to the affected students.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setBulkAction(null); setRejectReason(""); }}
                className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={runBulk}
                disabled={processing}
                className={`text-white px-4 py-2 rounded-lg disabled:opacity-50
                  ${bulkAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {processing ? "Processing..." : `Confirm ${bulkAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}