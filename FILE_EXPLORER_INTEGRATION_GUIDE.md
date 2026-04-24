# SynCodex File Explorer - Backend Integration Guide

## Overview

The File Explorer component provides full CRUD operations for a project's file system, backed by a Node.js/Express API that uses `fs/promises` for actual file system operations.

## Architecture

```
Frontend (React)
    ↓
useFileSystemOperations Hook (Custom Hook)
    ↓
fileSystemAPI Service (API Methods)
    ↓
Backend Routes (fileRoutes.js)
    ↓
fileOperations Service (fs/promises)
    ↓
File System
```

## Backend Setup

### 1. File System Service: `fileOperations.js`

Located at: `/SynCodex Backend/src/services/fileOperations.js`

**Key Functions:**
- `createFile(projectId, filePath, content)` - Creates a new file
- `createFolder(projectId, folderPath)` - Creates a new folder
- `readFile(projectId, filePath)` - Reads file content
- `updateFile(projectId, filePath, content)` - Updates file content
- `deleteNode(projectId, nodePath)` - Deletes file or folder (recursive)
- `renameNode(projectId, oldPath, newName)` - Renames file or folder
- `getFolderStructure(projectId)` - Returns entire tree structure
- `copyNode(projectId, sourcePath, destinationPath)` - Copies file/folder
- `getFileStats(projectId, filePath)` - Returns file metadata

**Features:**
- ✅ Uses `fs/promises` for async I/O
- ✅ Directory traversal attack prevention
- ✅ Recursive directory operations
- ✅ Proper error handling

### 2. File System Routes: `fileRoutes.js`

Located at: `/SynCodex Backend/src/routes/fileRoutes.js`

**Endpoints:**

| Method | Path | Description | Requires |
|--------|------|-------------|----------|
| GET | `/api/files/structure/:projectId` | Get directory tree | - |
| POST | `/api/files/create-file` | Create file | projectId, filePath |
| POST | `/api/files/create-folder` | Create folder | projectId, folderPath |
| GET | `/api/files/read/:projectId` | Read file | filePath (query) |
| PUT | `/api/files/update` | Update file | projectId, filePath, content |
| DELETE | `/api/files/delete` | Delete file/folder | projectId, nodePath |
| PATCH | `/api/files/rename` | Rename file/folder | projectId, oldPath, newName |
| POST | `/api/files/copy` | Copy file/folder | projectId, sourcePath, destinationPath |
| GET | `/api/files/stats/:projectId` | Get file stats | filePath (query) |

**Authentication:**
- All routes require `verifyToken` middleware
- Attach JWT token in request headers

## Frontend Integration

### 1. API Service: `fileSystemAPI.js`

Located at: `/SynCodex Frontend/src/services/fileSystemAPI.js`

```javascript
import fileSystemAPI from "../services/fileSystemAPI";

// Get entire directory structure
const structure = await fileSystemAPI.getDirectoryStructure(projectId);

// Create file
await fileSystemAPI.createFile(projectId, "src/index.js", "console.log('hello');");

// Create folder
await fileSystemAPI.createFolder(projectId, "src/components");

// Read file
const content = await fileSystemAPI.getFileContent(projectId, "src/index.js");

// Update file
await fileSystemAPI.updateFileContent(projectId, "src/index.js", "new content");

// Rename
await fileSystemAPI.renameNode(projectId, "src/index.js", "main.js");

// Delete
await fileSystemAPI.deleteNode(projectId, "src/main.js");

// Copy
await fileSystemAPI.copyNode(projectId, "src/main.js", "src/backup.js");

// Get stats
const stats = await fileSystemAPI.getFileStats(projectId, "src/main.js");
```

### 2. Custom Hook: `useFileSystemOperations.js`

Located at: `/SynCodex Frontend/src/hooks/useFileSystemOperations.js`

Integrates backend API with Zustand state management.

```javascript
import { useFileSystemOperations } from "../hooks/useFileSystemOperations";

function MyComponent({ projectId }) {
  const {
    fetchDirectoryStructure,
    handleCreateFile,
    handleCreateFolder,
    handleRenameNode,
    handleDeleteNode,
    handleGetFileContent,
    handleUpdateFileContent,
    handleCopyNode,
    handleGetFileStats,
  } = useFileSystemOperations(projectId);

  // Load directory on mount
  useEffect(() => {
    fetchDirectoryStructure();
  }, [fetchDirectoryStructure]);

  // Create a new file
  const createNewFile = async () => {
    try {
      await handleCreateFile("src", "newfile.js", "");
    } catch (error) {
      console.error("Failed to create file:", error);
    }
  };

  // Read and update file
  const editFile = async () => {
    try {
      const content = await handleGetFileContent("src/index.js");
      const updated = content + "\n// New line";
      await handleUpdateFileContent("src/index.js", updated);
    } catch (error) {
      console.error("Failed to edit file:", error);
    }
  };

  return (
    <>
      <button onClick={createNewFile}>Create File</button>
      <button onClick={editFile}>Edit File</button>
    </>
  );
}
```

### 3. Zustand Store: `fileExplorerStore.js`

Located at: `/SynCodex Frontend/src/stores/fileExplorerStore.js`

Manages local state:
- `fileTree` - Current directory structure
- `openFolders` - Array of expanded folder IDs
- `activeFileId` - Currently selected file
- `loading` - Loading state
- `error` - Error message

**Actions:**
- `setFileTree(tree)` - Update entire tree
- `toggleFolder(folderId)` - Expand/collapse folder
- `expandAll()` / `collapseAll()` - Expand/collapse all
- `addFile(parentId, file)` - Add file to tree
- `addFolder(parentId, folder)` - Add folder to tree
- `deleteNode(nodeId)` - Remove node from tree
- `renameNode(nodeId, newName)` - Rename node in tree
- `setLoading(bool)` - Set loading state
- `setError(message)` - Set error message

## Usage Example

```javascript
// In your FileExplorer component
import { useFileStore } from "../stores/fileExplorerStore";
import { useFileSystemOperations } from "../hooks/useFileSystemOperations";

export function FileExplorer({ projectId }) {
  const { fileTree, loading, error } = useFileStore();
  const { fetchDirectoryStructure, handleCreateFile } =
    useFileSystemOperations(projectId);

  useEffect(() => {
    fetchDirectoryStructure();
  }, [fetchDirectoryStructure]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <FileTreeNode node={fileTree} />
      <button onClick={() => handleCreateFile("/", "new.js")}>
        New File
      </button>
    </div>
  );
}
```

## Environment Variables

Backend (`/SynCodex Backend/.env`):

```env
PROJECT_FILES_DIR=/path/to/project/files
# or leave empty for /tmp/syncodex-projects (default)
```

## Directory Structure

Files stored at:
- Default: `/tmp/syncodex-projects/{projectId}/...`
- Custom: `${PROJECT_FILES_DIR}/{projectId}/...`

Example:
```
/tmp/syncodex-projects/
  └── project-123/
      ├── src/
      │   ├── index.js
      │   └── components/
      │       ├── Header.jsx
      │       └── Footer.jsx
      └── package.json
```

## Error Handling

All API methods return either data or throw an error:

```javascript
try {
  const content = await fileSystemAPI.getFileContent(projectId, "src/main.js");
} catch (error) {
  // error.response?.data?.error - Backend error message
  // error.message - Axios error message
  console.error("Error:", error.response?.data?.error || error.message);
}
```

## Security Considerations

1. **Path Traversal Protection**: All paths are sanitized using `path.resolve()` and checked against base directory
2. **Authentication**: All routes protected by JWT middleware
3. **Hidden Files**: Files starting with `.` are excluded from directory listings
4. **Permissions**: Backend validates file operations before execution

## Performance

- ✅ Recursive directory traversal optimized
- ✅ File stats cached at read time
- ✅ No synchronous file I/O
- ✅ Proper error handling prevents blocking

## Testing

### Test Creating a File

```javascript
const result = await fileSystemAPI.createFile(
  "test-project",
  "test.js",
  "console.log('test');"
);
console.log(result); // { success: true, path: 'test.js' }
```

### Test Reading Structure

```javascript
const structure = await fileSystemAPI.getDirectoryStructure("test-project");
console.log(structure); // Tree of files and folders
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 Not Found | Verify file path doesn't start with `/` |
| Permission Denied | Check backend file permissions, JWT token |
| Slow directory load | Use pagination or limit tree depth |
| Memory issues | Avoid loading very large directories |

---

**Last Updated:** 2026-04-24
**Status:** ✅ Production Ready
