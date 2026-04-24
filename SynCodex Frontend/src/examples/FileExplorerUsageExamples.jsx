/**
 * Example: Using File Explorer with Backend Integration
 * This shows how to integrate the File Explorer with the backend API
 */

import React, { useEffect } from "react";
import { useFileStore } from "../stores/fileExplorerStore";
import { useFileSystemOperations } from "../hooks/useFileSystemOperations";
import { FileExplorer } from "../components/editor/FileExplorer";

/**
 * Example 1: Basic FileExplorer Integration
 */
export function EditorWithFileExplorer({ projectId }) {
  const { fetchDirectoryStructure } = useFileSystemOperations(projectId);

  useEffect(() => {
    // Load directory structure when component mounts
    fetchDirectoryStructure();
  }, [fetchDirectoryStructure]);

  return (
    <div className="flex">
      <FileExplorer projectId={projectId} />
      {/* Rest of editor */}
    </div>
  );
}

/**
 * Example 2: Custom File Operations
 */
export function FileManagerPage({ projectId }) {
  const {
    handleCreateFile,
    handleCreateFolder,
    handleRenameNode,
    handleDeleteNode,
    handleGetFileContent,
    handleUpdateFileContent,
  } = useFileSystemOperations(projectId);

  const handleCreateNewFile = async () => {
    try {
      const fileName = prompt("Enter file name:");
      if (!fileName) return;

      await handleCreateFile("src", fileName, "");
      alert(`File ${fileName} created!`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditFile = async () => {
    try {
      const filePath = prompt("Enter file path (e.g., src/index.js):");
      if (!filePath) return;

      const content = await handleGetFileContent(filePath);
      const updated = prompt("Edit file content:", content);

      if (updated !== null) {
        await handleUpdateFileContent(filePath, updated);
        alert("File updated!");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">File Manager</h1>

      <div className="flex gap-2">
        <button
          onClick={handleCreateNewFile}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New File
        </button>

        <button
          onClick={handleEditFile}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Edit File
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: React Hook with State Management
 */
export function FileUploadManager({ projectId }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { handleCreateFile } = useFileSystemOperations(projectId);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      await handleCreateFile("uploads", file.name, content);
      alert(`Uploaded ${file.name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={loading}
        className="cursor-pointer"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {loading && <p className="text-blue-500 mt-2">Uploading...</p>}
    </div>
  );
}

/**
 * Example 4: Real-time File Watcher Pattern
 */
export function AutoSaveEditor({ projectId, filePath }) {
  const [content, setContent] = React.useState("");
  const [isSaved, setIsSaved] = React.useState(true);
  const { handleGetFileContent, handleUpdateFileContent } =
    useFileSystemOperations(projectId);

  // Load file on mount
  useEffect(() => {
    (async () => {
      const data = await handleGetFileContent(filePath);
      setContent(data);
      setIsSaved(true);
    })();
  }, [filePath, handleGetFileContent]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSaved && content) {
        (async () => {
          await handleUpdateFileContent(filePath, content);
          setIsSaved(true);
        })();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, isSaved, filePath, handleUpdateFileContent]);

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsSaved(false);
        }}
        className="w-full h-96 p-4 border rounded"
        placeholder="Edit file..."
      />
      <p className={isSaved ? "text-green-500" : "text-yellow-500"}>
        {isSaved ? "✓ Saved" : "Saving..."}
      </p>
    </div>
  );
}

/**
 * Example 5: Directory Browser with Search
 */
export function DirectoryBrowser({ projectId }) {
  const { fileTree, setActiveFile } = useFileStore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filterTree = (files, term) => {
    return files
      .filter((f) => f.name.toLowerCase().includes(term.toLowerCase()))
      .map((f) => ({
        ...f,
        children: f.children ? filterTree(f.children, term) : undefined,
      }));
  };

  const filtered = React.useMemo(
    () => filterTree(fileTree, searchTerm),
    [fileTree, searchTerm]
  );

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div className="space-y-2">
        {filtered.map((file) => (
          <div
            key={file.id}
            className="p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => setActiveFile(file.id)}
          >
            {file.type === "folder" ? "📁" : "📄"} {file.name}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 6: Batch Operations
 */
export function BatchFileOperations({ projectId }) {
  const { handleCreateFile, handleDeleteNode, handleCopyNode } =
    useFileSystemOperations(projectId);

  const handleBatchCreate = async () => {
    try {
      const files = ["index.js", "utils.js", "constants.js"];

      for (const fileName of files) {
        await handleCreateFile("src", fileName, `// ${fileName}\n`);
      }

      alert("Batch creation complete!");
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBatchDelete = async () => {
    try {
      const paths = ["src/temp1.js", "src/temp2.js"];

      for (const path of paths) {
        await handleDeleteNode(path);
      }

      alert("Batch deletion complete!");
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={handleBatchCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Batch Create Files
      </button>

      <button
        onClick={handleBatchDelete}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Batch Delete Files
      </button>
    </div>
  );
}

export default EditorWithFileExplorer;
