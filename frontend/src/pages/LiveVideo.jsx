import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import toast from "react-hot-toast";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Users } from "lucide-react";
import { createPeerConnection } from "../services/webrtc";

export default function LiveVideo() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [participants, setParticipants] = useState([]); // [{ socketId, stream, name }]

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const socketRef = useRef(null);

  // Load room details
  useEffect(() => {
    api
      .get(`/video/room/${roomId}`)
      .then((r) => setRoom(r.data))
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load room");
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [roomId, navigate]);

  // Setup local media + socket signaling
  useEffect(() => {
    if (loading || !room) return;
    let mounted = true;

    const init = async () => {
      try {
        // 1. Get local stream
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // 2. Connect socket
        const socket = getSocket();
        if (!socket) {
          toast.error("Socket not connected. Please refresh.");
          return;
        }
        socketRef.current = socket;

        // 3. Join room
        socket.emit("video:join", {
          roomId: room._id,
          userInfo: {
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          },
        });

        // ============================================================
        // SIGNALING EVENT HANDLERS
        // ============================================================

        // Existing users in the room → create peer connections
        socket.on("video:existing-users", async (existingUsers) => {
          for (const u of existingUsers) {
            await createOfferForPeer(u.socketId);
          }
        });

        // New user joined → wait for their offer
        socket.on("video:user-joined", ({ socketId, name }) => {
          console.log("👤 New user joined:", name);
        });

        // Receive offer → create answer
        socket.on("video:offer", async ({ from, offer }) => {
          const pc = createPeerConnection(
            (candidate) => {
              socket.emit("video:ice-candidate", { to: from, candidate });
            },
            (stream) => {
              addRemoteStream(from, stream);
            }
          );
          peersRef.current[from] = pc;

          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("video:answer", { to: from, answer });
        });

        // Receive answer
        socket.on("video:answer", async ({ from, answer }) => {
          const pc = peersRef.current[from];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        // Receive ICE candidate
        socket.on("video:ice-candidate", async ({ from, candidate }) => {
          const pc = peersRef.current[from];
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("ICE candidate error:", err);
            }
          }
        });

        // User left
        socket.on("video:user-left", ({ socketId }) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].close();
            delete peersRef.current[socketId];
          }
          setParticipants((prev) =>
            prev.filter((p) => p.socketId !== socketId)
          );
        });

        // Helper: create offer for a specific peer
        async function createOfferForPeer(socketId) {
          const pc = createPeerConnection(
            (candidate) => {
              socket.emit("video:ice-candidate", { to: socketId, candidate });
            },
            (stream) => {
              addRemoteStream(socketId, stream);
            }
          );
          peersRef.current[socketId] = pc;

          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("video:offer", { to: socketId, offer });
        }

        // Helper: add remote stream to state
        function addRemoteStream(socketId, stream) {
          setParticipants((prev) => {
            const existing = prev.find((p) => p.socketId === socketId);
            if (existing) {
              return prev.map((p) =>
                p.socketId === socketId ? { ...p, stream } : p
              );
            }
            return [...prev, { socketId, stream, name: "Participant" }];
          });
        }
      } catch (err) {
        console.error("Init error:", err);
        toast.error("Failed to access camera/microphone");
        navigate(-1);
      }
    };

    init();

    return () => {
      mounted = false;
      const socket = socketRef.current;
      if (socket) {
        socket.emit("video:leave", { roomId: room._id });
        socket.off("video:existing-users");
        socket.off("video:user-joined");
        socket.off("video:offer");
        socket.off("video:answer");
        socket.off("video:ice-candidate");
        socket.off("video:user-left");
      }
      // Close peers
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [loading, room, user, navigate]);

  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioOn;
      setAudioOn(!audioOn);
    }
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const leave = async () => {
    try {
      if (user.role === "lecturer" || user.role === "admin") {
        if (confirm("End class for everyone?")) {
          await api.put(`/video/end/${room._id}`);
          toast.success("Class ended");
        } else {
          navigate(-1);
          return;
        }
      }
      navigate(-1);
    } catch (err) {
      navigate(-1);
    }
  };

  if (loading) return <Loader text="Joining class..." />;
  if (!room) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between text-white">
        <div>
          <p className="font-semibold">{room.title}</p>
          <p className="text-xs text-slate-400">
            {room.course?.code} · {room.course?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Users size={16} />
          <span>{participants.length + 1} participants</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Local video */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              You ({user.firstName})
            </div>
          </div>

          {/* Remote videos */}
          {participants.map((p) => (
            <RemoteTile key={p.socketId} stream={p.stream} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center justify-center gap-3">
        <button
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            audioOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600"
          } text-white`}
        >
          {audioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            videoOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600"
          } text-white`}
        >
          {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={leave}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

function RemoteTile({ stream }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        Participant
      </div>
    </div>
  );
}