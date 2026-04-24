import React, { useEffect, useRef } from 'react';
import {
  FileCode,
  FolderPlus,
  Copy,
  Trash2,
  Edit2,
  Download,
} from 'lucide-react';
import { useFileStore } from '../../stores/fileExplorerStore';

/**
 * FileContextMenu Component
 * Right-click context menu for file/folder operations
 * Positioned dynamically with boundary detection
 * Consumes Zustand state for context menu management
 */
const FileContextMenu = ({
  projectId,
  onFileCreate,
  onFileDelete,
  onFileRename,
}) => {
  const { contextMenu, hideContextMenu, setRenamingItem } = useFileStore();
  const menuRef = useRef(null);

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (!contextMenu.visible || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - 10;
    const maxY = window.innerHeight - 10;

    let { x, y } = contextMenu;
    if (rect.right > maxX) x -= rect.width;
    if (rect.bottom > maxY) y -= rect.height;

    menuRef.current.style.left = `${Math.max(0, x)}px`;
    menuRef.current.style.top = `${Math.max(0, y)}px`;
  }, [contextMenu.visible, contextMenu.x, contextMenu.y]);

  if (!contextMenu.visible || !contextMenu.target) return null;

  const { target } = contextMenu;
  const isFolder = target.type === 'folder';

  const handleNewFile = () => {
    onFileCreate?.('file', target.id);
    hideContextMenu();
  };

  const handleNewFolder = () => {
    onFileCreate?.('folder', target.id);
    hideContextMenu();
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete ${target.type} "${target.name}"? This cannot be undone.`
      )
    ) {
      onFileDelete?.(target);
      hideContextMenu();
    }
  };

  const handleRename = () => {
    setRenamingItem({
      id: target.id,
      type: target.type,
      currentName: target.name,
    });
    hideContextMenu();
  };

  const handleDownload = async () => {
    if (isFolder) {
      // Download folder as zip
      console.log('Downloading folder:', target.name);
    } else {
      // Download single file
      console.log('Downloading file:', target.name);
    }
    hideContextMenu();
  };

  const handleCopy = () => {
    const copyText = `${target.type === 'folder' ? '📁' : '📄'} ${target.name}`;
    navigator.clipboard.writeText(copyText);
    hideContextMenu();
  };

  return (
    <>
      {/* Overlay to close menu on outside click */}
      {contextMenu.visible && (
        <div
          className="fixed inset-0 z-40"
          onClick={hideContextMenu}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* Context Menu */}
      <div
        ref={menuRef}
        className="
          fixed z-50 bg-gray-700 rounded shadow-lg
          border border-gray-600 overflow-hidden
          min-w-max
        "
        style={{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
        }}
      >
        {/* File/Folder Info */}
        <div className="px-3 py-2 border-b border-gray-600 bg-gray-800">
          <p className="text-xs text-gray-400">
            {isFolder ? '📁 Folder' : '📄 File'}
          </p>
          <p className="text-sm text-gray-100 truncate font-semibold max-w-[200px]">
            {target.name}
          </p>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {/* New File (only for folders) */}
          {isFolder && (
            <MenuItem
              icon={FileCode}
              label="New File"
              onClick={handleNewFile}
            />
          )}

          {/* New Folder (only for folders) */}
          {isFolder && (
            <MenuItem
              icon={FolderPlus}
              label="New Folder"
              onClick={handleNewFolder}
            />
          )}

          {/* Divider */}
          {isFolder && <div className="my-1 border-t border-gray-600" />}

          {/* Rename */}
          <MenuItem
            icon={Edit2}
            label="Rename"
            onClick={handleRename}
          />

          {/* Copy */}
          <MenuItem
            icon={Copy}
            label="Copy"
            onClick={handleCopy}
          />

          {/* Download */}
          <MenuItem
            icon={Download}
            label="Download"
            onClick={handleDownload}
            disabled
          />

          {/* Divider */}
          <div className="my-1 border-t border-gray-600" />

          {/* Delete */}
          <MenuItem
            icon={Trash2}
            label="Delete"
            onClick={handleDelete}
            variant="danger"
          />
        </div>
      </div>
    </>
  );
};

/**
 * Menu Item Component
 */
const MenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}) => {
  const baseClasses =
    'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors w-full text-left';

  const variantClasses = {
    default:
      'text-gray-200 hover:bg-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed',
    danger:
      'text-red-400 hover:bg-red-900/30 disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <Icon size={14} className="flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
};

export default FileContextMenu;
