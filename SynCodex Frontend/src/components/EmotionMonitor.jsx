import { useEffect, useMemo, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { toast } from "react-toastify";
import { inferEmotionChunk } from "../services/emotionApi";
import { useHealthStore } from "../stores/healthStore";

const EMOTION_UI = {
  neutral: { icon: "😐", label: "Neutral" },
  calm: { icon: "🧘", label: "Calm" },
  happy: { icon: "🙂", label: "Happy" },
  sad: { icon: "😔", label: "Sad" },
  angry: { icon: "😠", label: "Angry" },
  fearful: { icon: "😰", label: "Fearful" },
  disgust: { icon: "🤢", label: "Disgust" },
  surprised: { icon: "😮", label: "Surprised" },
  unknown: { icon: "🎙️", label: "Unknown" },
};

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function EmotionMonitor({ sessionId = "local", chunkMs = 3500, onEmotion, isVisible = true }) {
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const consecutiveFailuresRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [permission, setPermission] = useState("idle");
  const [isInferring, setIsInferring] = useState(false);
  const [error, setError] = useState("");
  const [isDisconnected, setIsDisconnected] = useState(false);

  const {
    currentEmotion,
    confidence,
    moodBucket,
    pushEmotion,
    canTriggerBreakReminder,
    markBreakReminder,
  } = useHealthStore();

  const ui = useMemo(() => EMOTION_UI[currentEmotion] || EMOTION_UI.neutral, [currentEmotion]);

  const status = useMemo(() => {
    if (isDisconnected || permission === "denied") return "disconnected";
    if (isListening || isInferring) return "listening";
    return "idle";
  }, [isDisconnected, permission, isListening, isInferring]);

  const statusText = useMemo(() => {
    if (status === "disconnected") return "Disconnected";
    if (status === "listening") return "Listening";
    return "Idle";
  }, [status]);

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
      return;
    }
    requestAndStart();
  };

  const handleChunk = async (audioBlob) => {
    if (!audioBlob || audioBlob.size < 1024) return;
    setIsInferring(true);

    try {
      const audioBase64 = await blobToDataUrl(audioBlob);
      const result = await inferEmotionChunk({
        audioBase64,
        mimeType: audioBlob.type || "audio/webm",
        sessionId,
      });

      consecutiveFailuresRef.current = 0;
      setIsDisconnected(false);
      setError("");

      pushEmotion(result);
      if (typeof onEmotion === "function") {
        onEmotion(result);
      }

      if (result && canTriggerBreakReminder()) {
        toast.info("Mood-aware assistant: you sound stressed. Take a short break.");
        markBreakReminder();
      }
    } catch (err) {
      consecutiveFailuresRef.current += 1;
      setIsDisconnected(true);
      setError(err?.response?.data?.message || err.message || "Emotion inference failed");

      if (consecutiveFailuresRef.current >= 3) {
        toast.error("Emotion monitor paused after repeated inference errors. Try enabling mic again.");
        stopListening();
      }
    } finally {
      setIsInferring(false);
    }
  };

  const requestAndStart = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setPermission("granted");
      setIsDisconnected(false);
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          handleChunk(event.data);
        }
      };

      recorder.onerror = (event) => {
        setIsDisconnected(true);
        setError(event.error?.message || "Recorder error");
      };

      recorder.start(chunkMs);
      mediaRecorderRef.current = recorder;
      consecutiveFailuresRef.current = 0;
      setIsListening(true);
    } catch {
      setPermission("denied");
      setIsDisconnected(true);
      setError("Microphone permission denied. Enable microphone access in your browser.");
      stopListening();
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-3 z-40 flex items-center justify-end">
      <div className="relative group">
        <button
          type="button"
          onClick={toggleMic}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
            status === "disconnected"
              ? "text-red-400 hover:bg-red-950/40"
              : status === "listening"
              ? "text-emerald-300 hover:bg-emerald-950/30"
              : "text-slate-300 hover:bg-slate-800"
          }`}
          title={isListening ? "Disable microphone" : "Enable microphone"}
          aria-label={isListening ? "Disable microphone" : "Enable microphone"}
        >
          <Mic className={`h-4 w-4 ${status === "listening" ? "animate-pulse" : ""}`} />
          <span className="hidden sm:inline">Mood: {ui.label}</span>
        </button>

        <div className="absolute right-0 bottom-9 w-56 rounded-md border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl opacity-0 pointer-events-none translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Status</span>
            <span className={`${status === "disconnected" ? "text-red-400" : status === "listening" ? "text-emerald-300" : "text-slate-300"}`}>
              {statusText}
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Last Emotion</span>
            <span>{ui.icon} {ui.label}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Confidence</span>
            <span>{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Mood State</span>
            <span>{moodBucket === "stressed" ? "Stressed" : "Stable"}</span>
          </div>
          {error ? <p className="text-red-400 mt-2 line-clamp-2">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
