import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const EMOTION_UI = {
  neutral: { icon: "😐", label: "Neutral" },
  calm: { icon: "🧘", label: "Calm" },
  happy: { icon: "🙂", label: "Happy" },
  sad: { icon: "😔", label: "Sad" },
  angry: { icon: "😠", label: "Angry" },
  fearful: { icon: "😰", label: "Fearful" },
  disgust: { icon: "🤢", label: "Disgust" },
  surprised: { icon: "😮", label: "Surprised" },
  unknown: { icon: "🎙️", label: "Listening..." },
};

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function AudioStreamer({
  socketUrl = import.meta.env.VITE_EMOTION_WS_URL || "http://localhost:7001",
  confidenceThreshold = 0.7,
  chunkMs = 3000,
  onEmotion,
}) {
  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [emotion, setEmotion] = useState("unknown");
  const [confidence, setConfidence] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const emotionUi = useMemo(() => EMOTION_UI[emotion] || EMOTION_UI.unknown, [emotion]);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setStatus("connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setStatus("disconnected");
    });

    socket.on("emotion_result", (payload) => {
      if (!payload) return;

      if (payload.status === "error") {
        setError(payload.error || "Inference error");
        setStatus("error");
        return;
      }

      const nextConfidence = Number(payload.confidence || 0);
      const nextEmotion = payload.emotion || "unknown";

      if (nextConfidence < confidenceThreshold || !nextEmotion || nextEmotion === "unknown") {
        setStatus(payload.status || "ignored_low_confidence");
        return;
      }

      setEmotion(nextEmotion);
      setConfidence(nextConfidence);
      setStatus(payload.status || "accepted");

      if (typeof onEmotion === "function") {
        onEmotion({
          emotion: nextEmotion,
          confidence: nextConfidence,
          rawEmotion: payload.raw_emotion || nextEmotion,
          scores: payload.scores || {},
          status: payload.status,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [confidenceThreshold, onEmotion, socketUrl]);

  const stopStreaming = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    setIsStreaming(false);
  };

  const startStreaming = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0 || !socketRef.current) return;

        const base64Audio = await blobToDataUrl(event.data);
        socketRef.current.emit("audio_chunk", {
          audio: base64Audio,
          mimeType: event.data.type || mimeType,
          ts: Date.now(),
        });
      };

      recorder.onerror = (event) => {
        setError(event.error?.message || "Recorder error");
        setStatus("error");
      };

      recorder.start(chunkMs);
      setIsStreaming(true);
      setStatus("streaming");
    } catch (err) {
      setError(err.message || "Microphone access denied");
      setStatus("error");
    }
  };

  useEffect(() => {
    return () => stopStreaming();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[#21232f] border-t border-[#3D415A] px-3 flex items-center justify-between text-white z-50">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-base" role="img" aria-label={emotionUi.label}>
          {emotionUi.icon}
        </span>
        <span className="font-semibold">{emotionUi.label}</span>
        <span className="text-gray-300">{(confidence * 100).toFixed(1)}%</span>
        <span className="text-xs text-gray-400">{status}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
        {isStreaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            className="bg-[#3D415A] px-2 py-1 rounded text-xs cursor-pointer"
          >
            Stop Mic
          </button>
        ) : (
          <button
            type="button"
            onClick={startStreaming}
            className="bg-[#3D415A] px-2 py-1 rounded text-xs cursor-pointer"
            disabled={!isConnected}
          >
            Start Mic
          </button>
        )}
      </div>

      {error ? <p className="absolute -top-6 left-3 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
