import API from "./api";

const API_BASE = "/api/files";

export const fileSystemAPI = {
  /**
   * Get the entire directory structure for a project
   * GET /api/files/structure/:projectId
   */
  getDirectoryStructure: (projectId) =>
    API.get(`${API_BASE}/structure/${projectId}`),

  /**
   * Create a new file
   * POST /api/files/create-file
   */
  createFile: (projectId, filePath, content = "") =>
    API.post(`${API_BASE}/create-file`, {
      projectId,
      filePath,
      content,
    }),

  /**
   * Create a new folder
   * POST /api/files/create-folder
   */
  createFolder: (projectId, folderPath) =>
    API.post(`${API_BASE}/create-folder`, {
      projectId,
      folderPath,
    }),

  /**
   * Rename a file or folder
   * PATCH /api/files/rename
   */
  renameNode: (projectId, oldPath, newName) =>
    API.patch(`${API_BASE}/rename`, {
      projectId,
      oldPath,
      newName,
    }),

  /**
   * Delete a file or folder
   * DELETE /api/files/delete
   */
  deleteNode: (projectId, nodePath) =>
    API.delete(`${API_BASE}/delete`, {
      data: { projectId, nodePath },
    }),

  /**
   * Read file content
   * GET /api/files/read/:projectId?filePath=...
   */
  getFileContent: (projectId, filePath) =>
    API.get(`${API_BASE}/read/${projectId}`, {
      params: { filePath },
    }),

  /**
   * Update file content
   * PUT /api/files/update
   */
  updateFileContent: (projectId, filePath, content) =>
    API.put(`${API_BASE}/update`, {
      projectId,
      filePath,
      content,
    }),

  /**
   * Copy a file or folder
   * POST /api/files/copy
   */
  copyNode: (projectId, sourcePath, destinationPath) =>
    API.post(`${API_BASE}/copy`, {
      projectId,
      sourcePath,
      destinationPath,
    }),

  /**
   * Get file statistics (size, modified date, etc.)
   * GET /api/files/stats/:projectId?filePath=...
   */
  getFileStats: (projectId, filePath) =>
    API.get(`${API_BASE}/stats/${projectId}`, {
      params: { filePath },
    }),
};

export default fileSystemAPI;
