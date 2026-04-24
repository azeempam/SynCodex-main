import { useCallback } from "react";
import { FolderOpen } from "lucide-react";
import { useFileStore } from "../../stores/fileExplorerStore";
import { directoryHandleToJsonTree } from "../../utils/directoryTree";

const OpenFolderButton = () => {
  const { setFileTree, setLoading, setError } = useFileStore();

  const handleOpenFolder = useCallback(async () => {
    if (typeof window === "undefined" || !window.showDirectoryPicker) {
      setError("Open Folder is not supported in this browser.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: "read",
      });

      const tree = await directoryHandleToJsonTree(directoryHandle);
      setFileTree([tree]);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      setError(error?.message || "Failed to open folder.");
      console.error("Open Folder failed:", error);
    } finally {
      setLoading(false);
    }
  }, [setError, setFileTree, setLoading]);

  return (
    <button
      type="button"
      onClick={handleOpenFolder}
      className="h-9 inline-flex items-center gap-2 rounded-md border border-[#3f4559] bg-[#2a2f40] px-3 text-xs font-medium text-[#d7deff] hover:bg-[#333a50] hover:border-[#596382] focus:outline-none focus:ring-2 focus:ring-[#4f5d8c] transition-colors"
      aria-label="Open local folder"
      title="Open local folder"
    >
      <FolderOpen size={14} className="text-[#9fb1ff]" />
      <span>Open Folder</span>
    </button>
  );
};

export default OpenFolderButton;
