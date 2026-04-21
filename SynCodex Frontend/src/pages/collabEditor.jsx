import { useParams } from "react-router-dom";
import CollabEditorLayout from "../components/editor/CollabEditorLayout";
import useMeta from "../hooks/useMeta";

export default function CollabEditorPage() {
  useMeta();
  const { roomId } = useParams();
  return <CollabEditorLayout roomId={roomId} isInterviewMode={false} />;
}
