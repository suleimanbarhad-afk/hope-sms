import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

export default function AdminResults() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ student: "", course: "", marks: "", semester: 1, academicYear: "2024/2025" });

  const load = async () => {
    setLoading(true);
    const [s, c, r] = await Promise.all([
      api.get("/students?limit=100"),
      api.get("/courses?limit=100"),
      api.get("/results"),
    ]);
    setStudents(s.data.data);
    setCourses(c.data.data);
    setResults(r.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/results", { ...form, marks: +form.marks });
      toast.success("Result added");
      setForm({ ...form, student: "", course: "", marks: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Result Management</h1>

      <form onSubmit={save} className="card grid md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Student</label>
          <select required className="input" value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.studentId} · {s.firstName} {s.lastName}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Course</label>
          <select required className="input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} · {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Marks</label>
          <input required type="number" min={0} max={100} className="input" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
        </div>
        <button className="btn-primary md:col-span-5 md:w-auto w-full">Add Result</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="p-3">Student</th>
              <th className="p-3">Course</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Point</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r._id} className="border-b hover:bg-slate-50">
                <td className="p-3">{r.student?.firstName} {r.student?.lastName}</td>
                <td className="p-3">{r.course?.code}</td>
                <td className="p-3">{r.marks}</td>
                <td className="p-3 font-medium">{r.grade}</td>
                <td className="p-3">{r.gradePoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}