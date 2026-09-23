import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import {
  Building2, Save, DollarSign, Calendar, Plus, RefreshCw,
  Trash2, AlertCircle,
} from "lucide-react";

export default function AdminFeeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    schoolName: "Hope Secondary School",
    email: "",
    phone: "",
    address: "",
  });
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    mobileMoneyNumber: "",
    mobileMoneyName: "",
  });
  const [semesterForm, setSemesterForm] = useState({
    academicYear: "2024/2025",
    sem1Start: "",
    sem2Start: "",
    gracePeriodDays: 21,
  });
  const [feeStructures, setFeeStructures] = useState([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [creatingDefaults, setCreatingDefaults] = useState(false);

  // Load settings
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/fees/settings");
        const s = res.data || {};
        setSchoolForm({
          schoolName: s.schoolName || "Hope Secondary School",
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
        });
        setBankForm({
          bankName: s.bankName || "",
          bankAccountNumber: s.bankAccountNumber || "",
          bankAccountName: s.bankAccountName || "",
          mobileMoneyNumber: s.mobileMoneyNumber || "",
          mobileMoneyName: s.mobileMoneyName || "",
        });

        const ay = s.academicYear || "2024/2025";
        const dates = s.semesterStartDates?.[ay] || {};
        setSemesterForm({
          academicYear: ay,
          sem1Start: dates["1"]
            ? new Date(dates["1"]).toISOString().split("T")[0]
            : "",
          sem2Start: dates["2"]
            ? new Date(dates["2"]).toISOString().split("T")[0]
            : "",
          gracePeriodDays: s.gracePeriodDays ?? 21,
        });
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load fee structures
  const loadFeeStructures = async () => {
    setLoadingFees(true);
    try {
      const res = await api.get("/fee-structures", {
        params: { academicYear: semesterForm.academicYear },
      });
      setFeeStructures(res.data || []);
    } catch (err) {
      // silent
    } finally {
      setLoadingFees(false);
    }
  };

  useEffect(() => {
    if (semesterForm.academicYear) loadFeeStructures();
    /* eslint-disable-next-line */
  }, [semesterForm.academicYear]);

  // Save settings
  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...schoolForm,
        ...bankForm,
        academicYear: semesterForm.academicYear,
        gracePeriodDays: Number(semesterForm.gracePeriodDays),
        semesterStartDates: {
          [semesterForm.academicYear]: {
            "1": semesterForm.sem1Start || null,
            "2": semesterForm.sem2Start || null,
          },
        },
      };

      await api.put("/fees/settings", payload);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Create default fee structures
  const createDefaults = async () => {
    if (
      !confirm(
        `Create default fee structure ($200 first sem / $180 second sem) for ${semesterForm.academicYear}?`
      )
    )
      return;
    try {
      setCreatingDefaults(true);
      const res = await api.post("/fee-structures/bulk-defaults", {
        academicYear: semesterForm.academicYear,
      });
      toast.success(res.data.message);
      loadFeeStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setCreatingDefaults(false);
    }
  };

  // Update fee row
  const updateFeeRow = async (fee, field, value) => {
    try {
      const updated = { ...fee, [field]: Number(value) || value };
      await api.put(`/fee-structures/${fee._id}`, {
        [field]: Number(value) || value,
      });
      toast.success("Updated");
      loadFeeStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // Delete a fee
  const deleteFee = async (id) => {
    if (!confirm("Delete this fee structure?")) return;
    try {
      await api.delete(`/fee-structures/${id}`);
      toast.success("Deleted");
      loadFeeStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // Add fee
  const addFee = async () => {
    if (!newYear) return toast.error("Select a year");
    try {
      await api.post("/fee-structures", {
        academicYear: semesterForm.academicYear,
        year: Number(newYear),
        semester: 1,
        amount: 200,
        description: `Year ${newYear} · Semester 1`,
      });
      await api.post("/fee-structures", {
        academicYear: semesterForm.academicYear,
        year: Number(newYear),
        semester: 2,
        amount: 180,
        description: `Year ${newYear} · Semester 2`,
      });
      toast.success(`Year ${newYear} added`);
      setNewYear("");
      loadFeeStructures();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // Group by year
  const groupedFees = {};
  feeStructures.forEach((f) => {
    if (!groupedFees[f.year]) groupedFees[f.year] = {};
    groupedFees[f.year][f.semester] = f;
  });
  const years = Object.keys(groupedFees).sort((a, b) => a - b);

  if (loading) return <Loader text="Loading settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fee Settings</h1>
        <p className="text-sm text-slate-500">
          Configure the school bank account, semester dates, and fee structure.
        </p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        {/* ============ SCHOOL INFO ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Building2 size={16} className="text-slate-500" />
            School Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School Name
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={schoolForm.schoolName}
                onChange={(e) =>
                  setSchoolForm({ ...schoolForm, schoolName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={schoolForm.email}
                onChange={(e) =>
                  setSchoolForm({ ...schoolForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={schoolForm.phone}
                onChange={(e) =>
                  setSchoolForm({ ...schoolForm, phone: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={schoolForm.address}
                onChange={(e) =>
                  setSchoolForm({ ...schoolForm, address: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* ============ BANK ACCOUNT ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign size={16} className="text-blue-600" />
              School Bank Account
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All students will see this account on their fees page. They pay here, then
              record the transaction.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bank Name
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="CRDB Bank"
                value={bankForm.bankName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Number
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                placeholder="0150-1234-5678-90"
                value={bankForm.bankAccountNumber}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    bankAccountNumber: e.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account Name
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Hope Secondary School"
                value={bankForm.bankAccountName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankAccountName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mobile Money Number
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="+255 712 345 678"
                value={bankForm.mobileMoneyNumber}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    mobileMoneyNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mobile Money Name
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Hope Secondary School"
                value={bankForm.mobileMoneyName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, mobileMoneyName: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* ============ SEMESTER DATES ============ */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            Semester Timeline
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="2024/2025"
                value={semesterForm.academicYear}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    academicYear: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Semester 1 Starts
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={semesterForm.sem1Start}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    sem1Start: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Semester 2 Starts
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={semesterForm.sem2Start}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    sem2Start: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Grace Period (days)
              </label>
              <input
                type="number"
                min={0}
                max={90}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={semesterForm.gracePeriodDays}
                onChange={(e) =>
                  setSemesterForm({
                    ...semesterForm,
                    gracePeriodDays: e.target.value,
                  })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Days after semester start before students are blocked
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* ============ FEE STRUCTURE ============ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign size={16} className="text-slate-500" />
              Fee Structure ({semesterForm.academicYear})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Default: Year 1–4 · Sem 1 = $200 · Sem 2 = $180
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createDefaults}
              disabled={creatingDefaults}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <RefreshCw size={14} />
              {creatingDefaults ? "Creating..." : "Reset to Defaults"}
            </button>
          </div>
        </div>

        {loadingFees ? (
          <Loader text="Loading fee structure..." />
        ) : feeStructures.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={18} />
            <div className="text-sm text-amber-900">
              <p className="font-medium">No fee structure set</p>
              <p className="text-xs">
                Click <strong>Reset to Defaults</strong> to create the standard
                $200 / $180 fees for Years 1–4.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="p-3">Year</th>
                    <th className="p-3">Semester 1</th>
                    <th className="p-3">Semester 2</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((y) => (
                    <tr key={y} className="border-b">
                      <td className="p-3 font-medium">Year {y}</td>
                      <td className="p-3">
                        {groupedFees[y][1] ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              defaultValue={groupedFees[y][1].amount}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (v !== groupedFees[y][1].amount) {
                                  updateFeeRow(groupedFees[y][1], "amount", v);
                                }
                              }}
                              className="w-24 border border-slate-300 rounded px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => deleteFee(groupedFees[y][1]._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {groupedFees[y][2] ? (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              defaultValue={groupedFees[y][2].amount}
                              onBlur={(e) => {
                                const v = Number(e.target.value);
                                if (v !== groupedFees[y][2].amount) {
                                  updateFeeRow(groupedFees[y][2], "amount", v);
                                }
                              }}
                              className="w-24 border border-slate-300 rounded px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => deleteFee(groupedFees[y][2]._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-end gap-2 pt-3 border-t">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Add Year
                </label>
                <select
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                >
                  <option value="">Select year...</option>
                  {[1, 2, 3, 4, 5, 6]
                    .filter((y) => !groupedFees[y])
                    .map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addFee}
                disabled={!newYear}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}