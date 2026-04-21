import { useNavigate } from "react-router-dom";
import useMeta from "../hooks/useMeta";

export default function InterviewGuidelines() {
  useMeta();
  const navigate = useNavigate();
  // Get sessionData from localStorage
  const sessionId = sessionStorage.getItem("roomId");
  let roomId = null;
  // Check if sessionData exists
  if (sessionId) {
    roomId = sessionId;
  } else { 
    console.log("No session data found.");
  }

  const handleStart = async () => {
    try {
      await document.documentElement.requestFullscreen();
      navigate(`/interview-editor/${roomId}`);
    } catch (err) {
      alert(
        "Fullscreen request denied. Please allow it to continue the interview."
      );
      console.warn("Fullscreen error:", err);
    }
  };

  return (
    <div className="h-screen bg-[#21232f] text-white flex flex-col justify-center items-center text-center px-6">
      <h1 className="text-3xl font-bold mb-4">Interview Guidelines</h1>
      <p className="mb-2">
        Be respectful, stay on topic, and keep your mic muted when not speaking.
      </p>
      <p className="mb-2">Everything is monitored and recorded.</p>
      <p className="mb-6 text-sm text-gray-400">
        Click below to begin the interview session.
      </p>

      <button
        onClick={handleStart}
        className="bg-gradient-to-b from-[#94FFF2] to-[#506DFF] px-6 py-2 rounded-lg font-semibold text-black hover:opacity-90 transition"
      >
        Start Interview
      </button>
    </div>
  );
}
