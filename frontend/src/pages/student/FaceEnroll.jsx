import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";
import FaceCapture from "../../components/FaceCapture";
import toast from "react-hot-toast";
import { ScanFace, CheckCircle2, ArrowLeft } from "lucide-react";

export default function FaceEnroll() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/face/status")
      .then((r) => setStatus(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCapture = async (descriptor) => {
    try {
      setSaving(true);
      setShowCamera(false);
      await api.post("/face/enroll", { descriptor });
      toast.success("Face enrolled successfully!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save face");
    } finally {
      setSaving(false);
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
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
              status?.enrolled
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {status?.enrolled ? (
              <CheckCircle2 size={40} />
            ) : (
              <ScanFace size={40} />
            )}
          </div>
          <h1 className="text-xl font-bold">
            {status?.enrolled ? "Face Enrolled" : "Enroll Your Face"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {status?.enrolled
              ? `Enrolled on ${new Date(status.enrolledAt).toLocaleDateString()}. You can now mark attendance by scanning your face.`
              : "Register your face once. Then mark attendance in 1 second by looking at your camera."}
          </p>
        </div>

        {!status?.enrolled && (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Look directly at your camera</li>
                <li>We capture 128 tiny numeric features (no photo stored)</li>
                <li>Your face is matched later when you mark attendance</li>
                <li>Secure & private — no images ever leave your device</li>
              </ul>
            </div>

            <button
              onClick={() => setShowCamera(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50"
            >
              <ScanFace size={18} />
              {saving ? "Saving..." : "Start Face Capture"}
            </button>
          </>
        )}

        {status?.enrolled && (
          <button
            onClick={() => setShowCamera(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-lg"
          >
            <ScanFace size={18} />
            Re-enroll Face
          </button>
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