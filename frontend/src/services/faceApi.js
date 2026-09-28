// Load face-api.js from CDN once
const CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js";
const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/";

let loaded = false;
let loadingPromise = null;

// Inject the CDN script into the page
const loadScript = () => {
  return new Promise((resolve, reject) => {
    if (window.faceapi) return resolve(window.faceapi);

    const script = document.createElement("script");
    script.src = CDN_URL;
    script.async = true;
    script.onload = () => resolve(window.faceapi);
    script.onerror = () => reject(new Error("Failed to load face-api.js"));
    document.body.appendChild(script);
  });
};

export const loadModels = async () => {
  if (loaded) return window.faceapi;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const faceapi = await loadScript();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    loaded = true;
    return faceapi;
  })();

  return loadingPromise;
};

/**
 * Capture a 128-d descriptor from a video element.
 * Returns null if no face detected.
 */
export const getDescriptorFromVideo = async (videoEl) => {
  const faceapi = await loadModels();

  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true) // true = tiny landmark model
    .withFaceDescriptor();

  if (!detection) return null;

  return Array.from(detection.descriptor);
};