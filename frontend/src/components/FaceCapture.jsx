import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { loadModels, getDescriptorFromVideo } from "../services/faceApi";

export default function FaceCapture({ onCapture, onClose, autoStart = true }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading AI models...");
  const [ready, setReady] = useState(false);

  // Start camera + load models
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        // Load models first
        setStatus("Loading AI models (first time only)...");
        await loadModels();

        if (!active) return;

        // Then request camera
        setStatus("Starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoading(false);
        setReady(true);
        setStatus("Position your face in the frame");
      } catch (err) {
        console.error(err);
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera in your browser.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Use a device with a camera.");
        } else {
          setError(err.message || "Failed to start camera");
        }
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = async () => {
    if (!videoRef.current || !ready) return;

    try {
      setStatus("Analyzing face...");
      setReady(false);

      const descriptor = await getDescriptorFromVideo(videoRef.current);

      if (!descriptor) {
        setError("No face detected. Look directly at the camera and try again.");
        setStatus("Position your face in the frame");
        setReady(true);
        return;
      }

      setError("");
      setStatus("Face captured ✅");
      onCapture(descriptor);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze face. Try again.");
      setReady(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-5 max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera size={18} /> Face Capture
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video preview */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="text-white animate-spin" size={30} />
            </div>
          )}
          {/* Face frame overlay */}
          {!loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-white/60 rounded-[50%]" />
            </div>
          )}
        </div>

        {/* Status */}
        <p className="text-sm text-center text-slate-600">{status}</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={capture}
            disabled={!ready}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {ready ? "Capture Face" : "Please wait..."}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Your photo is never uploaded. Only a 128-number descriptor is stored.
        </p>
      </div>
    </div>
  );
}