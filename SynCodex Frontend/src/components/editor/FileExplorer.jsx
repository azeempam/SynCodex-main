import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  FilePlus,
  FolderPlus,
  FolderClosed,
  FolderOpen,
  File,
  Download,
  Search,
  MoreVertical,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import API from "../../services/api";
import { useFileStore } from "../../stores/fileExplorerStore";
import FileTreeNode from "./FileTreeNode";
import FileContextMenu from "./FileContextMenu";
import OpenFolderButton from "./OpenFolderButton";

export const FileExplorer = ({
  openFiles,
  setOpenFiles,
  setActiveFile,
  yDoc,
  sessionName,
  roomOrProjectId,
  isInterviewMode,
}) => {
  // Zustand store
  const {
    fileTree,
    setFileTree,
    expandAll,
    collapseAll,
    showContextMenu,
    hideContextMenu,
    contextMenu,
    setActiveFile: setStoreActiveFile,
  } = useFileStore();

  // Local state for backward compatibility
  const [creationMode, setCreationMode] = useState(null);
  const [newName, setNewName] = useState("");
  const [selectedFolderForFile, setSelectedFolderForFile] = useState("");
  const [validationError, setValidationError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const location = useLocation();

  const isCollab =
    (location.pathname.includes("/collab") ||
      location.pathname.includes("/interview")) &&
    Boolean(roomOrProjectId);

  const yFoldersMap = yDoc?.getMap ? yDoc.getMap("folders") : null;
  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    []
  );

  // Convert folders array to tree structure
  const convertToTree = useCallback((folders) => {
    return folders.map((folder) => ({
      id: folder.name || `folder-${Math.random()}`,
      type: "folder",
      name: folder.name,
      path: `/${folder.name}`,
      children: (folder.files || []).map((file) => ({
        id: `${folder.name}-${file.name}`,
        type: "file",
        name: file.name,
        path: `/${folder.name}/${file.name}`,
      })),
    }));
  }, []);

  // Fetch folder structure
  const fetchFolderStructure = useCallback(async () => {
    if (isCollab) {
      const collabActions = JSON.parse(
        localStorage.getItem("collabActions") || "{}"
      );
      const { action, hostEmail } = collabActions[roomOrProjectId] || {};

      try {
        const response = await API.get("/api/rooms/room-folder-structure", {
          headers: {
            token: localStorage.getItem("token"),
            email:
              action === "joined"
                ? hostEmail
                : localStorage.getItem("email"),
            roomid: roomOrProjectId,
          },
        });
        const tree = convertToTree(response.data);
        setFileTree(tree);
        if (tree.length > 0) {
          setSelectedFolderForFile(tree[0].name);
        }
      } catch (error) {
        console.error("Error fetching room folder structure:", error);
      }
    } else {
      try {
        const response = await API.get(`/api/files/structure/${roomOrProjectId}`, {
          headers: authHeaders,
        });
        const tree = response.data?.data || [];
        setFileTree(tree);
        if (tree.length > 0) {
          setSelectedFolderForFile(tree[0].name);
        }
      } catch (error) {
        console.error("Error fetching project folder structure:", error);
      }
    }
  }, [isCollab, roomOrProjectId, convertToTree, setFileTree, authHeaders]);

  useEffect(() => {
    fetchFolderStructure();
  }, [fetchFolderStructure]);

  // Handle Yjs updates
  useEffect(() => {
    if (!isCollab || !yFoldersMap) return;

    const updateFolders = () => {
      const folders = Array.from(yFoldersMap.entries()).map(([name, data]) => ({
        name,
        files: data.files || [],
      }));
      const tree = convertToTree(folders);
      setFileTree(tree);
    };

    yFoldersMap.observeDeep(updateFolders);
    updateFolders();

    return () => yFoldersMap.unobserveDeep(updateFolders);
  }, [isCollab, yFoldersMap, convertToTree, setFileTree]);

  // Validation functions
  const validateFileName = (name) => {
    if (!name) return "Name cannot be empty";
    const existingInLocal = fileTree.some(
      (f) =>
        f.children &&
        f.children.some((file) => file.name === name)
    );
    const existingInYjs =
      isCollab &&
      Array.from(yFoldersMap?.values() || [])
        .flatMap((folder) => folder.files)
        .some((file) => file.name === name);

    if (existingInLocal || existingInYjs) {
      return "File name must be unique";
    }
    return "";
  };

  const validateFolderName = (name) => {
    if (!name) return "Name cannot be empty";
    const existingInLocal = fileTree.some((f) => f.name === name);
    const existingInYjs = isCollab && yFoldersMap?.has(name);

    if (existingInLocal || existingInYjs) {
      return "Folder name already exists";
    }
    return "";
  };

  // File creation handlers
  const handleAddFolder = () => {
    setCreationMode("folder");
    setNewName("");
    setValidationError("");
  };

  const handleAddFile = () => {
    setCreationMode("file");
    setNewName("");
    setValidationError("");
  };

  const handleCreateSubmit = async () => {
    let error = "";
    if (creationMode === "folder") {
      error = validateFolderName(newName);
    } else if (creationMode === "file") {
      if (!selectedFolderForFile) error = "Please select a folder";
      else error = validateFileName(newName);
    }

    if (error) {
      setValidationError(error);
      return;
    }

    try {
      if (isCollab) {
        if (creationMode === "folder") {
          if (yFoldersMap.has(newName)) return;
          yFoldersMap.set(newName, { files: [] });

          if (!isInterviewMode) {
            await API.post(
              "/api/rooms/create-room-folder",
              { folderName: newName },
              {
                headers: {
                  token: localStorage.getItem("token"),
                  email: localStorage.getItem("email"),
                  roomid: roomOrProjectId,
                },
              }
            );
          }
        } else {
          const folder = yFoldersMap.get(selectedFolderForFile);
          if (folder) {
            const newFile = {
              name: newName,
              content: "",
              language: newName.split(".").pop() || "plaintext",
            };
            yFoldersMap.set(selectedFolderForFile, {
              ...folder,
              files: [...folder.files, newFile],
            });

            if (!isInterviewMode) {
              await API.post(
                "/api/rooms/create-room-file",
                { fileName: newName },
                {
                  headers: {
                    token: localStorage.getItem("token"),
                    email: localStorage.getItem("email"),
                    roomid: roomOrProjectId,
                    foldername: selectedFolderForFile,
                  },
                }
              );
            }
          }
        }
      } else {
        if (creationMode === "folder") {
          await API.post(
            "/api/files/create-folder",
            {
              projectId: roomOrProjectId,
              folderPath: newName,
            },
            { headers: authHeaders }
          );
        } else {
          await API.post(
            "/api/files/create-file",
            {
              projectId: roomOrProjectId,
              filePath: `${selectedFolderForFile}/${newName}`,
              content: "",
            },
            { headers: authHeaders }
          );
        }
        await fetchFolderStructure();
      }

      if (creationMode === "file") {
        const newFile = {
          name: newName,
          folderName: selectedFolderForFile,
          path: `/${selectedFolderForFile}/${newName}`,
        };
        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFile(newFile);
      }

      setCreationMode(null);
      setNewName("");
      setValidationError("");
    } catch (error) {
      console.error("Creation failed:", error);
      setValidationError(
        error.response?.data?.message || "Creation failed"
      );
    }
  };

  // Download session
  const handleDownloadSession = async () => {
    const zip = new JSZip();
    const folders = fileTree;

    for (const folder of folders) {
      if (folder.children) {
        for (const file of folder.children) {
          const filePath = `${folder.name}/${file.name}`;
          let content = "";

          if (yDoc) {
            const yText = yDoc.getText(file.name);
            content = yText.toString();
          } else {
            content = localStorage.getItem(`file-${file.name}`) || "";
          }

          zip.file(filePath, content);
        }
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const zipName = sessionName || "synCodex-session";
    saveAs(blob, `${zipName}.zip`);
  };

  // Filter files based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return fileTree;
    return filterTree(fileTree, searchTerm.toLowerCase());
  }, [fileTree, searchTerm]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (node) => {
      if (node.type === "file") {
        const folderName = node.path.split("/")[1] || "";
        const fileData = {
          name: node.name,
          folderName,
          path: node.path,
        };
        if (!openFiles.some((f) => f.name === fileData.name)) {
          setOpenFiles([...openFiles, fileData]);
        }
        setActiveFile(fileData);
        setStoreActiveFile(node.id);
      }
    },
    [openFiles, setOpenFiles, setActiveFile, setStoreActiveFile]
  );

  const handleNodeDelete = useCallback(
    async (target) => {
      if (!target?.path) return;

      try {
        if (isCollab) {
          console.warn("Delete via /api/files is not enabled for collab mode.");
          return;
        }

        await API.delete("/api/files/delete", {
          headers: authHeaders,
          data: {
            projectId: roomOrProjectId,
            nodePath: target.path.replace(/^\//, ""),
          },
        });

        await fetchFolderStructure();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    },
    [isCollab, authHeaders, roomOrProjectId, fetchFolderStructure]
  );

  const handleNodeRename = useCallback(
    async (node, newName) => {
      if (!node?.path || !newName) return;

      try {
        if (isCollab) {
          return;
        }

        await API.patch(
          "/api/files/rename",
          {
            projectId: roomOrProjectId,
            oldPath: node.path.replace(/^\//, ""),
            newName,
          },
          { headers: authHeaders }
        );

        await fetchFolderStructure();
      } catch (error) {
        console.error("Rename failed:", error);
      }
    },
    [isCollab, authHeaders, roomOrProjectId, fetchFolderStructure]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e, node) => {
      showContextMenu(e, {
        id: node.id,
        type: node.type,
        name: node.name,
        path: node.path,
      });
    },
    [showContextMenu]
  );

  // Close context menu and menu dropdown on outside click
  useEffect(() => {
    const handleClick = () => {
      hideContextMenu();
      setShowMenu(false);
    };
    if (contextMenu.visible || showMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible, showMenu, hideContextMenu]);

  return (
    <div className="text-sm border-r border-[#e4e6f3ab] min-w-[255px] max-w-[255px] flex flex-col justify-between h-full bg-[#21232f]">
      {/* Creation Modal */}
      {creationMode && (
        <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-[#3D415A] p-6 rounded-lg w-[35%] shadow-4xl">
            <h3 className="text-white text-lg font-semibold mb-4">
              New {creationMode === "folder" ? "Folder" : "File"}
            </h3>

            {creationMode === "file" && (
              <>
                <label
                  htmlFor="folderSelect"
                  className="text-white font-semibold uppercase"
                >
                  {" "}
                  Select Folder
                </label>
                <select
                  className="w-full mb-4 bg-[#21232f] text-white p-2 rounded-md outline-none"
                  value={selectedFolderForFile}
                  onChange={(e) => setSelectedFolderForFile(e.target.value)}
                  id="folderSelect"
                >
                  {fileTree.map((folder) => (
                    <option key={folder.id} value={folder.name}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label
              htmlFor="newNameInput"
              className="text-white font-semibold uppercase"
            >
              {creationMode} name
            </label>
            <input
              autoFocus
              className="w-full bg-[#21232f] text-white mt-1 p-2 rounded-md outline-none mb-2"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setValidationError("");
              }}
              placeholder={`Enter ${creationMode} name...`}
              onKeyDown={(e) => e.key === "Enter" && handleCreateSubmit()}
              id="newNameInput"
            />

            {validationError && (
              <p className="text-red-400 text-sm mb-2">{validationError}</p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-300 hover:text-red-400 rounded-md transition-colors "
                onClick={() => setCreationMode(null)}
                onKeyDown={(e) =>
                  e.key === "Escape" && setCreationMode(null)
                }
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-b from-[#94FFF2] to-[#506DFF] text-white rounded-md hover:opacity-90 cursor-pointer transition-colors"
                onClick={handleCreateSubmit}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="sidebar-header px-4 py-2 h-20 overflow-clip text-white text-lg font-semibold flex items-end border-b border-[#e4e6f3ab]">
          {sessionName}
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 border-b border-[#e4e6f3ab]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full bg-[#3D415A] text-gray-200 placeholder-gray-500
                px-3 py-1 pl-7 rounded text-xs
                outline-none border border-transparent
                hover:border-gray-600 focus:border-blue-500
                transition-colors
              "
            />
          </div>
        </div>

        {/* Action Buttons & Menu */}
        <div className="flex justify-between items-center gap-4 px-3 mb-2 border-b border-[#e4e6f3ab] py-2">
          <div className="flex gap-2">
            <button
              className="p-2 rounded-sm cursor-pointer hover:bg-[#3D415A] transition-colors"
              onClick={handleAddFile}
              title="Add File"
              aria-label="Add File"
              type="button"
              name="Add File"
            >
              <FilePlus color="white" height={20} />
            </button>
            <button
              className="p-2 rounded-sm cursor-pointer hover:bg-[#3D415A] transition-colors"
              onClick={handleAddFolder}
              title="Add Folder"
              aria-label="Add Folder"
              type="button"
              name="Add Folder"
            >
              <FolderPlus color="white" height={20} />
            </button>
            <OpenFolderButton />
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-sm cursor-pointer hover:bg-[#3D415A] transition-colors"
              aria-label="More options"
            >
              <MoreVertical size={18} className="text-gray-200" />
            </button>

            {showMenu && (
              <div className="absolute top-10 right-0 bg-[#3D415A] rounded shadow-lg border border-gray-600 z-50">
                <button
                  onClick={() => {
                    expandAll();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => {
                    collapseAll();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors border-t border-gray-600"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Tree */}
        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar max-h-[calc(100vh-270px)] px-2">
          {Array.isArray(filteredTree) && filteredTree.length > 0 ? (
            filteredTree.map((node) => (
              <FileTreeNode
                key={node.id}
                node={node}
                level={0}
                onFileSelect={handleFileSelect}
                onContextMenu={handleContextMenu}
                onRename={handleNodeRename}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              {searchTerm ? "No files found" : "Empty folder"}
            </div>
          )}
        </div>
      </div>

      {/* Download Button */}
      <div
        className={`px-4 py-2 border-t border-[#e4e6f3ab] flex flex-col gap-2 justify-center items-center`}
        style={{ visibility: isInterviewMode ? "hidden" : "visible" }}
      >
        {!isInterviewMode && (
          <button
            onClick={handleDownloadSession}
            className="p-2 rounded-sm cursor-pointer text-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#3D415A] text-white w-[10rem] transition-colors"
          >
            <Download /> Download
          </button>
        )}
      </div>

      {/* Context Menu - Zustand managed */}
      <FileContextMenu
        projectId={roomOrProjectId}
        onFileCreate={(type, parentId) => {
          if (type === "file") {
            handleAddFile();
          } else {
            handleAddFolder();
          }
        }}
        onFileDelete={(nodeId) => {
          handleNodeDelete(nodeId);
        }}
        onFileRename={(nodeId, newName) => {
          handleNodeRename(nodeId, newName);
        }}
      />
    </div>
  );
};

/**
 * Filter tree based on search term
 */
function filterTree(nodes, searchTerm) {
  if (!Array.isArray(nodes)) return nodes;

  return nodes
    .filter((node) => {
      const matches = node.name.toLowerCase().includes(searchTerm);
      const hasMatchingChildren =
        node.children &&
        filterTree(node.children, searchTerm).length > 0;
      return matches || hasMatchingChildren;
    })
    .map((node) => ({
      ...node,
      children: node.children
        ? filterTree(node.children, searchTerm)
        : undefined,
    }));
}
