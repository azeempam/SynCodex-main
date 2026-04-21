import { useEffect } from "react";
import { useParams } from "react-router-dom";
import CollabEditorLayout from "../components/editor/CollabEditorLayout";
import useMeta from "../hooks/useMeta";

export default function InterviewEditorPage() {
  useMeta();
  const { roomId } = useParams();

  useEffect(() => {
    const handleExitFullScreen = () => {
      if (!document.fullscreenElement) {
        alert("You exited full screen. Interview session will now end.");
        window.close();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert(
          "You switched tabs or minimized the window. The interview session will now end."
        );
        window.close();
      }
    };

    document.addEventListener("fullscreenchange", handleExitFullScreen);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleExitFullScreen);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <CollabEditorLayout roomId={roomId} isInterviewMode={true} />;
}
