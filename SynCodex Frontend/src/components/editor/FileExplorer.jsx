import { useEffect, useState, useCallback } from "react";
import {
  FilePlus,
  FolderPlus,
  FolderClosed,
  FolderOpen,
  File,
  Download,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import API from "../../services/api";

export const FileExplorer = ({
  openFiles,
  setOpenFiles,
  setActiveFile,
  yDoc,
  sessionName,
  roomOrProjectId,
  isInterviewMode,
}) => {
  const [expanded, setExpanded] = useState({});
  const [folders, setFolders] = useState([]);
  const location = useLocation();
  const [creationMode, setCreationMode] = useState(null);
  const [newName, setNewName] = useState("");
  const [selectedFolderForFile, setSelectedFolderForFile] = useState("");
  const [validationError, setValidationError] = useState("");

  const isCollab =
    (location.pathname.includes("/collab") ||
      location.pathname.includes("/interview")) &&
    Boolean(roomOrProjectId);

  const yFoldersMap = yDoc?.getMap ? yDoc.getMap("folders") : null;

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
            email: action === "joined" ? hostEmail : localStorage.getItem("email"),
            roomid: roomOrProjectId,
          },
        });
        console.log("Room Folders :", response.data);
        setFolders(response.data);
      } catch (error) {
        console.error("Error fetching room folder structure:", error);
      }
    } else {
      try {
        const response = await API.get(
          "/api/projects/project-folder-structure",
          {
            headers: {
              token: localStorage.getItem("token"),
              email: localStorage.getItem("email"),
              projectid: roomOrProjectId,
            },
          }
        );
        setFolders(response.data);
      } catch (error) {
        console.error("Error fetching project folder structure:", error);
      }
    }
  }, [isCollab, roomOrProjectId, yFoldersMap]);

  useEffect(() => {
    fetchFolderStructure();
  }, [fetchFolderStructure]);

  // Validation functions
  const validateFileName = (name) => {
    if (!name) return "Name cannot be empty";
    const existingInLocal = folders.some((f) =>
      f.files.some((file) => file.name === name)
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
    // Check both sources for folders
    const existingInLocal = folders.some((f) => f.name === name);
    const existingInYjs = isCollab && yFoldersMap?.has(name);

    if (existingInLocal || existingInYjs) {
      return "Folder name already exists";
    }
    return "";
  };

  useEffect(() => {
    if (!isCollab || !yFoldersMap) return;

    const updateFolders = () => {
      const entries = Array.from(yFoldersMap.entries()).map(([name, data]) => ({
        name,
        files: data.files || [],
      }));
      setFolders(entries);
    };

    yFoldersMap.observeDeep(updateFolders);
    updateFolders();

    return () => yFoldersMap.unobserveDeep(updateFolders);
  }, [isCollab, yFoldersMap]);

  // Creation handlers
  const handleAddFolder = () => {
    setCreationMode("folder");
    setNewName("");
    setValidationError("");
  };

  const handleAddFile = () => {
    setCreationMode("file");
    setNewName("");
    setValidationError("");
    setSelectedFolderForFile(folders[0]?.name || "");
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
        // Collab mode - Yjs operations
        if (creationMode === "folder") {
          if (yFoldersMap.has(newName)) return;
          yFoldersMap.set(newName, { files: [] });

          if (!isInterviewMode){
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

            if (!isInterviewMode){
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
            "/api/projects/create-project-folder",
            { folderName: newName },
            {
              headers: {
                token: localStorage.getItem("token"),
                email: localStorage.getItem("email"),
                projectid: roomOrProjectId,
              },
            }
          );
        } else {
          await API.post(
            "/api/projects/create-project-file",
            { fileName: newName },
            {
              headers: {
                token: localStorage.getItem("token"),
                email: localStorage.getItem("email"),
                projectid: roomOrProjectId,
                folderName: selectedFolderForFile,
              },
            }
          );
        }
        await fetchFolderStructure();
      }

      // Update state
      if (creationMode === "file") {
        const newFile = {
          name: newName,
          folderName: selectedFolderForFile,
        };
        setOpenFiles((prev) => [...prev, newFile]);
        setActiveFile(newFile);
      }

      setCreationMode(null);
      setNewName("");
      setValidationError("");
    } catch (error) {
      console.error("Creation failed:", error);
      setValidationError(error.response?.data?.message || "Creation failed");
    }
  };

  const handleDownloadSession = async () => {
    const zip = new JSZip();

    for (const folder of folders) {
      for (const file of folder.files) {
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

    const blob = await zip.generateAsync({ type: "blob" });
    const zipName = sessionName || "synCodex-session";

    saveAs(blob, `${zipName}.zip`);
  };

  return (
    <div className="text-sm border-r border-[#e4e6f3ab] min-w-[255px] max-w-[255px] flex flex-col justify-between h-full bg-[#21232f]">
      {creationMode && (
        <div className="fixed inset-0 bg-[#00000093] bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-[#3D415A] p-6 rounded-lg w-[35%] shadow-4xl">
            <h3 className="text-white text-lg font-semibold mb-4">
              New {creationMode === "folder" ? "Folder" : "File"}
            </h3>

            {creationMode === "file" && (
              <>
                <label htmlFor="folderSelect" className="text-white font-semibold uppercase"> Select Folder</label>
                <select
                  className="w-full mb-4 bg-[#21232f] text-white p-2 rounded-md outline-none"
                  value={selectedFolderForFile}
                  onChange={(e) => setSelectedFolderForFile(e.target.value)}
                  id="folderSelect"
                >
                  {folders.map((folder) => (
                    <option key={folder.name} value={folder.name}>
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
                onKeyDown={(e) => e.key === "Escape" && setCreationMode(null)}
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
      <div>
        <div className="sidebar-header px-4 py-2 h-20 overflow-clip text-white text-lg font-semibold flex items-end border-b border-[#e4e6f3ab]">
          {sessionName}
        </div>
        <div className="flex justify-end gap-4 px-10 mb-4 border-b border-[#e4e6f3ab]">
          <button
            className="p-2 rounded-sm cursor-pointer hover:bg-[#3D415A]"
            onClick={handleAddFile}
            title="Add File"
            aria-label="Add File"
            type="button"
            name="Add File"
          >
            <FilePlus color="white" height={24} />
          </button>
          <button
            className="p-2 rounded-sm cursor-pointer hover:bg-[#3D415A]"
            onClick={handleAddFolder}
            title="Add Folder"
            aria-label="Add Folder"
            type="button"
            name="Add Folder"
          >
            <FolderPlus color="white" height={24} />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[calc(100vh-270px)] ">
          {folders.map((folder) => (
            <div key={folder.name} title={folder.name}>
              <div
                className="font-bold cursor-pointer text-white font-open-sans text-[16px] flex items-center gap-3 px-2"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [folder.name]: !prev[folder.name],
                  }))
                }
              >
                <div>
                  {expanded[folder.name] ? (
                    <FolderOpen color="white" height={"20"} />
                  ) : (
                    <FolderClosed color="white" height={"20"} />
                  )}{" "}
                </div>
                <p className="truncate">{folder.name}</p>
              </div>
              {expanded[folder.name] &&
                folder.files.map((file) => (
                  <div
                    key={file.name}
                    className="ml-4 mt-1 px-2 py-1 rounded hover:bg-[#3d415ab2] cursor-pointer flex items-center text-white gap-1 font-open-sans font-semibold truncate"
                    title={file.name}
                    onClick={() => {
                      const fileData = {
                        name: file.name,
                        folderName: folder.name,
                      };

                      if (!openFiles.some((f) => f.name === fileData.name)) {
                        setOpenFiles([...openFiles, fileData]);
                      }
                      setActiveFile(fileData);
                    }}
                  >
                    <div>
                      <File color="white" height={"20"} />
                    </div>
                    <p className="truncate">{file.name}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      <div 
        className={`px-4 py-2 border-t border-[#e4e6f3ab] flex flex-col gap-2 justify-center items-center`}
        style={{ visibility: isInterviewMode ? "hidden" : "visible" }}  
      >
        {!isInterviewMode &&(
            <button
              onClick={handleDownloadSession}
              className="p-2 rounded-sm cursor-pointer text-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#3D415A] text-white w-[10rem]"
            >
              <Download /> Download
            </button>          
        )}
      </div>
    </div>
  );
};
