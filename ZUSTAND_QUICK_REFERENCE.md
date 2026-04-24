# Zustand File Store - Quick Reference

## Import
```jsx
import { useFileStore } from '../../stores/fileExplorerStore';
```

## State Properties
```jsx
const {
  openFolders,        // Array<string> - IDs of expanded folders
  activeFileId,       // string | null - Currently selected file
  fileTree,           // object - Complete file structure
  contextMenu,        // object - Right-click menu state
  renamingItem,       // object | null - Item being renamed
  loading,            // boolean
  error               // string | null
} = useFileStore();
```

## Actions (Methods)

### Folder Operations
```jsx
const {
  toggleFolder,       // (folderId: string) => void
  expandFolder,       // (folderId: string) => void
  collapseFolder,     // (folderId: string) => void
  expandAll,          // () => void
  collapseAll         // () => void
} = useFileStore();
```

### File Selection
```jsx
const {
  setActiveFile,      // (fileId: string) => void
  setFileTree         // (tree: object) => void
} = useFileStore();
```

### File Operations
```jsx
const {
  addFile,            // (parentId: string, file: object) => void
  addFolder,          // (parentId: string, folder: object) => void
  deleteNode,         // (nodeId: string) => void
  renameNode          // (nodeId: string, newName: string) => void
} = useFileStore();
```

### UI State
```jsx
const {
  showContextMenu,    // (event: Event, target: object) => void
  hideContextMenu,    // () => void
  setRenamingItem,    // (item: object | null) => void
  setLoading,         // (loading: boolean) => void
  setError            // (error: string | null) => void
} = useFileStore();
```

## Common Patterns

### Check if Folder is Expanded
```jsx
const isExpanded = openFolders.includes('folder-id-123');
```

### Check if File is Active
```jsx
const isActive = activeFileId === 'file-id-456';
```

### Toggle Folder on Click
```jsx
const handleToggle = (e, folderId) => {
  e.stopPropagation();
  toggleFolder(folderId);
};
```

### Set Active File on Click
```jsx
const handleFileClick = (e, fileNode) => {
  e.stopPropagation();
  setActiveFile(fileNode.id);
};
```

### Render Children Only if Expanded
```jsx
{isExpanded && node.children?.map(child => (
  <FileTreeNode key={child.id} node={child} />
))}
```

### Create New File
```jsx
const newFile = {
  id: `${parentId}-${fileName}`,
  type: 'file',
  name: fileName,
  path: `${parentPath}/${fileName}`
};
addFile(parentId, newFile);
```

### Create New Folder
```jsx
const newFolder = {
  id: `folder-${Date.now()}`,
  type: 'folder',
  name: folderName,
  path: `${parentPath}/${folderName}`,
  children: []
};
addFolder(parentId, newFolder);
```

## Complete Example: FileTreeNode

```jsx
import React, { useCallback, useMemo } from 'react';
import { useFileStore } from '../../stores/fileExplorerStore';
import { ChevronDown, ChevronRight, Folder, File } from 'lucide-react';

const FileTreeNode = ({ node, level = 0 }) => {
  const { openFolders, activeFileId, toggleFolder, setActiveFile } = useFileStore();

  const isExpanded = useCallback(
    () => openFolders.includes(node.id),
    [openFolders, node.id]
  );

  const isActive = node.id === activeFileId;
  const isFolder = node.type === 'folder';

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    toggleFolder(node.id);
  }, [node.id, toggleFolder]);

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    if (!isFolder) {
      setActiveFile(node.id);
    }
  }, [node.id, isFolder, setActiveFile]);

  return (
    <div>
      <div
        className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded ${
          isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
        }`}
        onClick={handleSelect}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        {isFolder && node.children?.length > 0 && (
          <button onClick={handleToggle} className="p-0">
            {isExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        
        {isFolder ? <Folder size={16} /> : <File size={16} />}
        <span>{node.name}</span>
      </div>

      {isFolder && isExpanded() && (
        <div>
          {node.children?.map(child => (
            <FileTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;
```

## Debugging with Redux DevTools

1. Install Redux DevTools Extension
2. Open Chrome DevTools → Redux tab
3. Actions tab: See all store actions in order
4. State tab: Inspect current state
5. Diff tab: See what changed with each action
6. Trace tab: See function call stack for each action

## Performance Tips

- ✅ Wrap components with `React.memo()`
- ✅ Use `useCallback()` for event handlers
- ✅ Store memoizes subscriptions automatically
- ✅ Only subscribe to state slices you need
- ✅ Avoid creating inline functions in render

## Common Issues

**State not updating?**
- Ensure you're calling the action, not trying to mutate directly
- Check that component is actually using the store hook

**Component re-rendering too much?**
- Wrap with `React.memo()`
- Check that handlers are using `useCallback`
- Profile with React DevTools Profiler

**Can't see store in Redux DevTools?**
- Install Redux DevTools browser extension
- Check that `devtools` middleware is included in store
- Reload page after installing extension
