# Zustand State Management Integration Guide

## Overview
The file explorer now uses **Zustand** for centralized state management. This replaces local component state with a global, efficient store that tracks folder expansion state and active file selection.

---

## Store Architecture

### File: `SynCodex Frontend/src/stores/fileExplorerStore.js`

The `useFileStore` Zustand store manages all file explorer state with the following structure:

#### **Core State**
```javascript
{
  openFolders: [],           // Array of folder IDs currently expanded
  activeFileId: null,        // Currently selected file ID
  fileTree: {},              // Complete file tree structure
  loading: false,            // Loading indicator
  error: null,               // Error message
  contextMenu: { ... },      // Right-click menu state
  renamingItem: null         // Item being renamed
}
```

#### **Key Actions**

##### Folder Management
| Action | Description | Usage |
|--------|-------------|-------|
| `toggleFolder(folderId)` | Toggle folder open/close | `toggleFolder('folder-123')` |
| `expandFolder(folderId)` | Expand a specific folder | `expandFolder('folder-123')` |
| `collapseFolder(folderId)` | Collapse a specific folder | `collapseFolder('folder-123')` |
| `expandAll()` | Expand all folders in tree | `expandAll()` |
| `collapseAll()` | Collapse all folders | `collapseAll()` |

##### File Selection
| Action | Description | Usage |
|--------|-------------|-------|
| `setActiveFile(fileId)` | Set active/selected file | `setActiveFile('file-456')` |
| `setFileTree(tree)` | Set complete file tree | `setFileTree(newTree)` |

##### File Operations
| Action | Description | Usage |
|--------|-------------|-------|
| `addFile(parentId, file)` | Add file to parent folder | `addFile('folder-123', fileNode)` |
| `addFolder(parentId, folder)` | Add folder and expand parent | `addFolder('folder-123', folderNode)` |
| `deleteNode(nodeId)` | Delete file or folder | `deleteNode('file-456')` |
| `renameNode(nodeId, newName)` | Rename file or folder | `renameNode('file-456', 'newName.js')` |

##### UI State Management
| Action | Description |
|--------|-------------|
| `showContextMenu(event, target)` | Show right-click context menu |
| `hideContextMenu()` | Hide context menu |
| `setRenamingItem(item)` | Set item being renamed |
| `setLoading(boolean)` | Set loading state |
| `setError(message)` | Set error message |

---

## Component Integration

### 1. FileTreeNode Component
**File:** `src/components/editor/FileTreeNode.jsx`

The recursive component now consumes Zustand state:

```jsx
import { useFileStore } from '../../stores/fileExplorerStore';

const FileTreeNode = ({ node, level = 0, onFileSelect, onContextMenu }) => {
  // Consume store state
  const { 
    openFolders, 
    activeFileId, 
    toggleFolder, 
    setActiveFile 
  } = useFileStore();

  // Check if folder is expanded
  const isExpanded = openFolders.includes(node.id);
  
  // Check if file is active
  const isActive = activeFileId === node.id;

  // Handle folder toggle
  const handleToggle = (e) => {
    e.stopPropagation();
    toggleFolder(node.id); // Updates openFolders in store
  };

  // Handle file selection
  const handleSelect = (e) => {
    e.stopPropagation();
    if (node.type === 'file') {
      setActiveFile(node.id); // Sets activeFileId in store
      onFileSelect?.(node);
    }
  };

  return (
    <div onClick={handleSelect} onContextMenu={handleContextMenu}>
      {/* Expanded/Collapsed Chevron */}
      {isExpanded ? <ChevronDown /> : <ChevronRight />}
      
      {/* Active file styling */}
      <span className={isActive ? 'bg-blue-600/40' : ''}>
        {node.name}
      </span>

      {/* Render children only if expanded */}
      {isExpanded && node.children?.map(child => (
        <FileTreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
};
```

### 2. FileExplorer Component
**File:** `src/components/editor/FileExplorer.jsx`

```jsx
import { useFileStore } from "../../stores/fileExplorerStore";

export const FileExplorer = ({ ... }) => {
  const {
    fileTree,
    setFileTree,
    expandAll,
    collapseAll,
    showContextMenu,
    hideContextMenu,
    contextMenu,
    setActiveFile
  } = useFileStore();

  // Use store state and actions
  // ...
};
```

### 3. FileContextMenu Component
**File:** `src/components/editor/FileContextMenu.jsx`

```jsx
import { useFileStore } from '../../stores/fileExplorerStore';

const FileContextMenu = ({ ... }) => {
  const { contextMenu, hideContextMenu, setRenamingItem } = useFileStore();

  // Context menu uses store for positioning and visibility
  return (
    <div 
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        display: contextMenu.visible ? 'block' : 'none'
      }}
    >
      {/* Menu items */}
    </div>
  );
};
```

### 4. useFileExplorerSocket Hook
**File:** `src/hooks/useFileExplorerSocket.js`

Real-time updates through Socket.io trigger store actions:

```jsx
import { useFileStore } from '../stores/fileExplorerStore';

export const useFileExplorerSocket = (socket, projectId) => {
  const { addFile, addFolder, deleteNode, renameNode } = useFileStore();

  useEffect(() => {
    socket?.on('file:created', ({ nodeData }) => {
      addFile(nodeData.parentId, nodeData); // Updates store
    });
    
    socket?.on('node:deleted', ({ nodeId }) => {
      deleteNode(nodeId); // Updates store
    });
  }, [socket]);
};
```

---

## Usage Examples

### Example 1: Opening a File
```jsx
// User clicks file in FileTreeNode
const handleFileClick = (fileNode) => {
  setActiveFile(fileNode.id); // Store state updates
  // Component re-renders with activeFileId set
};
```

### Example 2: Expanding a Folder
```jsx
// User clicks chevron
const handleFolderToggle = (folderId) => {
  toggleFolder(folderId);
  // If expandedFolders updates, FileTreeNode re-renders
  // Children only render if openFolders.includes(folderId)
};
```

### Example 3: Expand/Collapse All
```jsx
// Toolbar buttons
<button onClick={expandAll}>Expand All</button>
<button onClick={collapseAll}>Collapse All</button>
```

### Example 4: File Operations
```jsx
// After API call for file creation
const response = await API.post('/api/create-file', { ... });
addFile(parentFolderId, response.data);
// Store updates, component re-renders with new file
```

---

## State Flow Diagram

```
User Action (Click, Right-Click, etc.)
        ↓
Component Handler (FileTreeNode, FileExplorer)
        ↓
Zustand Store Action (toggleFolder, setActiveFile, etc.)
        ↓
Store State Update (openFolders, activeFileId)
        ↓
Component Re-render (only affected components)
        ↓
UI Update (expanded/collapsed, active highlighting)
```

---

## Performance Optimizations

1. **Array-based `openFolders`**: Efficient membership checking with `.includes()`
2. **React.memo**: FileTreeNode uses memoization to prevent unnecessary renders
3. **useCallback**: Event handlers are memoized to maintain referential equality
4. **Selective Subscriptions**: Components only subscribe to store slices they need
5. **Devtools Integration**: Zustand middleware for Redux DevTools debugging

---

## Devtools Integration

The store includes Redux DevTools middleware for debugging:

```javascript
import { devtools } from 'zustand/middleware';

export const useFileStore = create(
  devtools(
    (set, get) => ({ ... }),
    { name: 'FileStore' }
  )
);
```

**To Use in Browser:**
1. Install Redux DevTools extension
2. Open browser DevTools → Redux tab
3. See all state changes and actions in real-time
4. Time-travel debug by clicking on actions

---

## Migration from Local State

### Before (Local State)
```jsx
const [expandedFolders, setExpandedFolders] = useState(new Set());
const [activeFile, setActiveFile] = useState(null);

// Props drilling required
<FileTreeNode 
  expandedFolders={expandedFolders}
  activeFile={activeFile}
  onToggleFolder={(id) => setExpandedFolders(...)}
/>
```

### After (Zustand)
```jsx
// No local state needed
const { openFolders, activeFileId, toggleFolder, setActiveFile } = useFileStore();

// Store state directly in hook
<FileTreeNode node={node} />
```

---

## Common Patterns

### Pattern 1: Conditional Rendering Based on Active File
```jsx
const isActive = activeFileId === node.id;

return (
  <div className={isActive ? 'highlight' : ''}>
    {node.name}
  </div>
);
```

### Pattern 2: Conditional Rendering of Children
```jsx
const isExpanded = openFolders.includes(node.id);

return (
  <>
    {/* Header */}
    {isExpanded && node.children?.map(child => (
      <FileTreeNode key={child.id} node={child} />
    ))}
  </>
);
```

### Pattern 3: Batch Operations
```jsx
const handleSelectMultiple = (nodeIds) => {
  // Expand all parent folders
  nodeIds.forEach(id => expandFolder(getParentId(id)));
  // Set first as active
  setActiveFile(nodeIds[0]);
};
```

---

## Backwards Compatibility

The store exports both names for compatibility:

```javascript
export const useFileStore = create(/* ... */);
export const useFileExplorerStore = useFileStore; // Alias
```

Existing code using `useFileExplorerStore` will continue to work.

---

## Best Practices

✅ **Do:**
- Use the store for any state shared between components
- Memoize components to prevent unnecessary renders
- Use devtools for debugging complex state changes
- Keep actions pure (no side effects in store)

❌ **Don't:**
- Modify state directly outside of actions
- Store API responses without transformation
- Create too many small stores (group related state)
- Use store for temporary UI state (forms in-progress)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| State not updating | Check if action is correctly dispatching with `set()` |
| Unnecessary re-renders | Wrap component in `React.memo` and use `useCallback` for handlers |
| Store state undefined | Ensure component imports from correct path: `'../../stores/fileExplorerStore'` |
| Devtools not showing | Install Redux DevTools browser extension |

---

## Next Steps

- Monitor performance with React DevTools Profiler
- Add persistence middleware for localStorage
- Consider code splitting for large file trees
- Add error boundaries around file operations
