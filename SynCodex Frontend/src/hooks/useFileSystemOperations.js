import { useCallback } from "react";
import { useFileStore } from "../stores/fileExplorerStore";
import fileSystemAPI from "../services/fileSystemAPI";

/**
 * useFileSystemOperations Hook
 * Integrates Zustand file store with backend file system API
 * Handles CRUD operations with proper state management and error handling
 */
export const useFileSystemOperations = (projectId) => {
  const {
    setFileTree,
    setLoading,
    setError,
    addFile,
    addFolder,
    deleteNode,
    renameNode,
  } = useFileStore();

  const fetchDirectoryStructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileSystemAPI.getDirectoryStructure(projectId);
      setFileTree(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
      console.error("Failed to fetch directory structure:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, setFileTree, setLoading, setError]);

  const handleCreateFile = useCallback(
    async (folderPath, fileName, content = "") => {
      setError(null);
      try {
        const filePath = `${folderPath}/${fileName}`.replace(/^\//, "");
        await fileSystemAPI.createFile(projectId, filePath, content);
        const newFile = {
          id: filePath,
          type: "file",
          name: fileName,
          path: `/${filePath}`,
        };
        addFile(folderPath, newFile);
        return newFile;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to create file:", error);
        throw error;
      }
    },
    [projectId, addFile, setError]
  );

  const handleCreateFolder = useCallback(
    async (parentPath, folderName) => {
      setError(null);
      try {
        const folderPath = `${parentPath}/${folderName}`.replace(/^\//, "");
        await fileSystemAPI.createFolder(projectId, folderPath);
        const newFolder = {
          id: folderPath,
          type: "folder",
          name: folderName,
          path: `/${folderPath}`,
          children: [],
        };
        addFolder(parentPath, newFolder);
        return newFolder;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to create folder:", error);
        throw error;
      }
    },
    [projectId, addFolder, setError]
  );

  const handleRenameNode = useCallback(
    async (nodePath, newName) => {
      setError(null);
      try {
        await fileSystemAPI.renameNode(projectId, nodePath, newName);
        renameNode(nodePath, newName);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to rename node:", error);
        throw error;
      }
    },
    [projectId, renameNode, setError]
  );

  const handleDeleteNode = useCallback(
    async (nodePath) => {
      setError(null);
      try {
        await fileSystemAPI.deleteNode(projectId, nodePath);
        deleteNode(nodePath);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to delete node:", error);
        throw error;
      }
    },
    [projectId, deleteNode, setError]
  );

  const handleGetFileContent = useCallback(
    async (filePath) => {
      setError(null);
      try {
        const response = await fileSystemAPI.getFileContent(
          projectId,
          filePath
        );
        return response.data.content;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to read file:", error);
        throw error;
      }
    },
    [projectId, setError]
  );

  const handleUpdateFileContent = useCallback(
    async (filePath, content) => {
      setError(null);
      try {
        await fileSystemAPI.updateFileContent(projectId, filePath, content);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to update file:", error);
        throw error;
      }
    },
    [projectId, setError]
  );

  const handleCopyNode = useCallback(
    async (sourcePath, destinationPath) => {
      setError(null);
      try {
        await fileSystemAPI.copyNode(projectId, sourcePath, destinationPath);
        await fetchDirectoryStructure();
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to copy node:", error);
        throw error;
      }
    },
    [projectId, setError, fetchDirectoryStructure]
  );

  const handleGetFileStats = useCallback(
    async (filePath) => {
      setError(null);
      try {
        const response = await fileSystemAPI.getFileStats(projectId, filePath);
        return response.data.stats;
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        setError(errorMsg);
        console.error("Failed to get file stats:", error);
        throw error;
      }
    },
    [projectId, setError]
  );

  return {
    fetchDirectoryStructure,
    handleCreateFile,
    handleCreateFolder,
    handleRenameNode,
    handleDeleteNode,
    handleGetFileContent,
    handleUpdateFileContent,
    handleCopyNode,
    handleGetFileStats,
  };
};

export default useFileSystemOperations;
