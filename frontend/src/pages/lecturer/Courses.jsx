import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function LecturerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lecturer/courses")
      .then((r) => setCourses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading courses..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Courses</h1>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            No courses assigned yet. Contact the administrator to assign you to courses.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Code</th>
                <th className="p-3">Course Name</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Department</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Students</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-medium">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.creditHours}</td>
                  <td className="p-3">{c.department?.name || "—"}</td>
                  <td className="p-3">{c.semester}</td>
                  <td className="p-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {c.studentCount ?? 0}
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