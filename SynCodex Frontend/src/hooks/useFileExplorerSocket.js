import { useEffect, useCallback } from 'react';
import { useFileStore } from '../stores/fileExplorerStore';
import io from 'socket.io-client';

/**
 * Custom hook for Socket.io integration with File Explorer
 * Handles real-time file operations: create, delete, rename, update
 * Consumes Zustand store for file tree operations
 */
export const useFileExplorerSocket = (socket, projectId) => {
  const {
    fileTree,
    addFile,
    addFolder,
    deleteNode,
    renameNode,
  } = useFileStore();

  // Handle incoming file creation from other clients
  useEffect(() => {
    if (!socket) return;

    socket.on('file:created', ({ nodeId, parentFolderId, nodeData }) => {
      console.log('File created:', nodeData);
      addFile(parentFolderId, nodeData);
    });

    socket.on('folder:created', ({ nodeId, parentFolderId, nodeData }) => {
      console.log('Folder created:', nodeData);
      addFolder(parentFolderId, nodeData);
    });

    socket.on('node:deleted', ({ nodeId }) => {
      console.log('Node deleted:', nodeId);
      deleteNode(nodeId);
    });

    socket.on('node:renamed', ({ nodeId, newName }) => {
      console.log('Node renamed:', nodeId, newName);
      renameNode(nodeId, newName);
    });

    socket.on('file:updated', ({ fileId, content }) => {
      console.log('File updated:', fileId);
      // Emit event for editor to consume
      window.dispatchEvent(
        new CustomEvent('file:updated', {
          detail: { fileId, content },
        })
      );
    });

    return () => {
      socket.off('file:created');
      socket.off('folder:created');
      socket.off('node:deleted');
      socket.off('node:renamed');
      socket.off('file:updated');
    };
  }, [socket, addFile, addFolder, deleteNode, renameNode]);

  /**
   * Broadcast file creation to other clients
   */
  const broadcastFileCreate = useCallback(
    (parentFolderId, fileData) => {
      if (socket) {
        socket.emit('file:create', {
          projectId,
          parentFolderId,
          fileData,
        });
      }
    },
    [socket, projectId]
  );

  /**
   * Broadcast folder creation to other clients
   */
  const broadcastFolderCreate = useCallback(
    (parentFolderId, folderData) => {
      if (socket) {
        socket.emit('folder:create', {
          projectId,
          parentFolderId,
          folderData,
        });
      }
    },
    [socket, projectId]
  );

  /**
   * Broadcast node deletion to other clients
   */
  const broadcastNodeDelete = useCallback(
    (nodeId) => {
      if (socket) {
        socket.emit('node:delete', {
          projectId,
          nodeId,
        });
      }
    },
    [socket, projectId]
  );

  /**
   * Broadcast node rename to other clients
   */
  const broadcastNodeRename = useCallback(
    (nodeId, newName) => {
      if (socket) {
        socket.emit('node:rename', {
          projectId,
          nodeId,
          newName,
        });
      }
    },
    [socket, projectId]
  );

  /**
   * Broadcast file content update to other clients
   */
  const broadcastFileUpdate = useCallback(
    (fileId, content) => {
      if (socket) {
        socket.emit('file:update', {
          projectId,
          fileId,
          content,
        });
      }
    },
    [socket, projectId]
  );

  return {
    broadcastFileCreate,
    broadcastFolderCreate,
    broadcastNodeDelete,
    broadcastNodeRename,
    broadcastFileUpdate,
  };
};

export default useFileExplorerSocket;
