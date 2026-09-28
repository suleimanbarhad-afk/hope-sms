import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import FaceCapture from "../../components/FaceCapture";
import toast from "react-hot-toast";
import {
  ScanFace, CheckCircle2, AlertCircle, ArrowLeft, Clock,
} from "lucide-react";

export default function FaceAttendance() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [coursesRes, statusRes] = await Promise.all([
        api.get("/courses/my"),
        api.get("/face/status"),
      ]);
      setCourses(coursesRes.data || []);
      setEnrolled(statusRes.data.enrolled);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCapture = async (descriptor) => {
    if (!selectedCourse) {
      toast.error("Select a course first");
      setShowCamera(false);
      return;
    }

    try {
      setMarking(true);
      setShowCamera(false);
      setResult(null);

      const res = await api.post("/face/verify-and-mark", {
        courseId: selectedCourse,
        descriptor,
      });

      setResult({
        success: true,
        message: res.data.message,
        status: res.data.attendance?.status,
        distance: res.data.distance,
      });
      toast.success(res.data.message);
    } catch (err) {
      const data = err.response?.data || {};
      setResult({
        success: false,
        message: data.message || "Failed to mark attendance",
        code: data.code,
      });
      toast.error(data.message || "Failed");
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/student/attendance"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Attendance
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-3">
            <ScanFace className="text-white" size={40} />
          </div>
          <h1 className="text-xl font-bold">Mark Attendance with Face</h1>
          <p className="text-sm text-slate-500 mt-1">
            Just look at your camera — attendance in 1 second
          </p>
        </div>

        {!enrolled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
            <div className="text-sm text-amber-900 flex-1">
              <p className="font-semibold">Face not enrolled</p>
              <p className="text-xs mt-1">
                You need to enroll your face before you can mark attendance this way.
              </p>
              <Link
                to="/student/face-enroll"
                className="inline-block mt-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded"
              >
                Enroll Now →
              </Link>
            </div>
          </div>
        )}

        {enrolled && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Course
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setResult(null);
                }}
              >
                <option value="">Choose a course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.course?._id}>
                    {c.course?.code} · {c.course?.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCamera(true)}
              disabled={!selectedCourse || marking}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              <ScanFace size={18} />
              {marking ? "Verifying..." : "Start Face Scan"}
            </button>

            {result && (
              <div
                className={`rounded-lg p-4 flex items-start gap-3 ${
                  result.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium text-sm ${
                      result.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.success && result.status && (
                    <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                      <Clock size={12} /> Status: {result.status}
                    </p>
                  )}
                  {!result.success && result.code === "NO_MATCH" && (
                    <p className="text-xs text-red-700 mt-1">
                      Face did not match. Try better lighting or re-enroll.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCamera && (
        <FaceCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}