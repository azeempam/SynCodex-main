import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Professional-grade Zustand store for File Explorer state management
 * Tracks open folders and active file selection with comprehensive file operations
 */
export const useFileStore = create(
  devtools(
    (set, get) => ({
      // Core State
      openFolders: [], // Array of folder IDs that are currently open/expanded
      activeFileId: null, // Currently selected/active file ID
      fileTree: {}, // Complete file tree structure
      loading: false,
      error: null,
      
      // UI State
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        target: null, // { id, type: 'file' | 'folder', name, path }
      },
      renamingItem: null, // { id, type, currentName }

      // === Core Actions ===
      
      /**
       * Set the complete file tree structure
       */
      setFileTree: (tree) => set({ fileTree: tree }),
      
      /**
       * Set the active file ID when a file is clicked
       */
      setActiveFile: (fileId) => set({ activeFileId: fileId }),

      /**
       * Toggle folder open/close state
       */
      toggleFolder: (folderId) => {
        const openFolders = get().openFolders;
        const isOpen = openFolders.includes(folderId);
        
        set({
          openFolders: isOpen
            ? openFolders.filter(id => id !== folderId)
            : [...openFolders, folderId]
        });
      },

      /**
       * Expand a folder
       */
      expandFolder: (folderId) => {
        const openFolders = get().openFolders;
        if (!openFolders.includes(folderId)) {
          set({ openFolders: [...openFolders, folderId] });
        }
      },

      /**
       * Collapse a folder
       */
      collapseFolder: (folderId) => {
        set({
          openFolders: get().openFolders.filter(id => id !== folderId)
        });
      },

      /**
       * Expand all folders in the tree
       */
      expandAll: () => {
        const allFolderIds = getAllFolderIds(get().fileTree);
        set({ openFolders: allFolderIds });
      },

      /**
       * Collapse all folders
       */
      collapseAll: () => {
        set({ openFolders: [] });
      },

      // === Context Menu Actions ===
      showContextMenu: (e, target) => {
        e.preventDefault();
        e.stopPropagation();
        set({
          contextMenu: {
            visible: true,
            x: e.clientX,
            y: e.clientY,
            target,
          },
        });
      },

      hideContextMenu: () => {
        set({
          contextMenu: {
            visible: false,
            x: 0,
            y: 0,
            target: null,
          },
        });
      },

      // === Renaming Actions ===
      setRenamingItem: (item) => set({ renamingItem: item }),

      // === File Operations ===
      /**
       * Add a file to the tree
       */
      addFile: (parentFolderId, file) => {
        const tree = { ...get().fileTree };
        addNodeToTree(tree, parentFolderId, file);
        set({ fileTree: tree });
      },

      /**
       * Add a folder to the tree and expand parent
       */
      addFolder: (parentFolderId, folder) => {
        const tree = { ...get().fileTree };
        addNodeToTree(tree, parentFolderId, folder);
        set({ fileTree: tree });
        get().expandFolder(parentFolderId);
      },

      /**
       * Delete a node from the tree
       */
      deleteNode: (nodeId) => {
        const tree = { ...get().fileTree };
        removeNodeFromTree(tree, nodeId);
        set({ fileTree: tree });
      },

      /**
       * Rename a node in the tree
       */
      renameNode: (nodeId, newName) => {
        const tree = { ...get().fileTree };
        updateNodeInTree(tree, nodeId, { name: newName });
        set({ fileTree: tree, renamingItem: null });
      },

      // === State Management ===
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'FileStore' }
  )
);

// Export both names for backwards compatibility
export const useFileExplorerStore = useFileStore;

/**
 * Helper functions for tree manipulation
 */
function getAllFolderIds(node, ids = []) {
  if (node.type === 'folder') {
    ids.push(node.id);
    if (node.children) {
      node.children.forEach((child) => getAllFolderIds(child, ids));
    }
  }
  return ids;
}

function addNodeToTree(tree, parentId, newNode) {
  if (parentId === 'root' && Array.isArray(tree)) {
    tree.push(newNode);
    return;
  }

  function findAndAdd(nodes) {
    if (!nodes) return false;
    if (Array.isArray(nodes)) {
      for (let node of nodes) {
        if (node.id === parentId && node.type === 'folder') {
          if (!node.children) node.children = [];
          node.children.push(newNode);
          return true;
        }
        if (findAndAdd(node.children)) return true;
      }
    }
    return false;
  }

  findAndAdd(tree.children || tree);
}

function removeNodeFromTree(tree, nodeId) {
  function findAndRemove(nodes) {
    if (!nodes) return false;
    if (Array.isArray(nodes)) {
      const index = nodes.findIndex((node) => node.id === nodeId);
      if (index !== -1) {
        nodes.splice(index, 1);
        return true;
      }
      for (let node of nodes) {
        if (findAndRemove(node.children)) return true;
      }
    }
    return false;
  }

  findAndRemove(tree.children || tree);
}

function updateNodeInTree(tree, nodeId, updates) {
  function findAndUpdate(nodes) {
    if (!nodes) return false;
    if (Array.isArray(nodes)) {
      for (let node of nodes) {
        if (node.id === nodeId) {
          Object.assign(node, updates);
          return true;
        }
        if (findAndUpdate(node.children)) return true;
      }
    }
    return false;
  }

  findAndUpdate(tree.children || tree);
}

export default useFileStore;
