import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function LecturerStudents() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [studRes, coursesRes] = await Promise.all([
          api.get("/lecturer/students"),
          api.get("/lecturer/courses"),
        ]);
        setEnrollments(studRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader text="Loading students..." />;

  const filtered = enrollments.filter((e) => {
    if (selectedCourse && e.course?._id !== selectedCourse) return false;
    const haystack = `${e.student?.firstName} ${e.student?.lastName} ${e.student?.studentId} ${e.student?.email}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Students</h1>
        <div className="flex gap-2">
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} · {c.name}</option>
            ))}
          </select>
          <input
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No students found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Student ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Year</th>
                <th className="p-3">Course</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{e.student?.studentId}</td>
                  <td className="p-3">{e.student?.firstName} {e.student?.lastName}</td>
                  <td className="p-3">{e.student?.email}</td>
                  <td className="p-3">{e.student?.yearOfStudy}</td>
                  <td className="p-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {e.course?.code}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}