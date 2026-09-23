import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/Loader";

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/courses/my")
      .then((res) => setEnrollments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) =>
    `${e.course?.code} ${e.course?.name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <Loader text="Loading courses..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <input
          className="w-full sm:max-w-xs border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">
            {enrollments.length === 0
              ? "You are not enrolled in any courses yet."
              : "No courses match your search."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="p-3">Code</th>
                <th className="p-3">Course Name</th>
                <th className="p-3">Credit Hours</th>
                <th className="p-3">Lecturer</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                // Lecturer may be an object (populated) OR a string OR null
                const lecturerName =
                  e.course?.lecturer && typeof e.course.lecturer === "object"
                    ? `${e.course.lecturer.firstName || ""} ${e.course.lecturer.lastName || ""}`.trim() || "—"
                    : e.course?.lecturerName || e.course?.lecturer || "—";

                return (
                  <tr key={e._id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{e.course?.code || "—"}</td>
                    <td className="p-3">{e.course?.name || "—"}</td>
                    <td className="p-3">{e.course?.creditHours ?? "—"}</td>
                    <td className="p-3">{lecturerName}</td>
                    <td className="p-3">{e.semester ?? "—"}</td>
                    <td className="p-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                        {e.status || "enrolled"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}