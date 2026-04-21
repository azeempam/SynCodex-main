import { X } from "lucide-react";

export const FileTabs = ({
  openFiles,
  activeFile,
  setActiveFile,
  setOpenFiles,
}) => {
  const closeTab = (e, fileToClose) => {
    e.stopPropagation();
    const updatedTabs = openFiles.filter(
      (f) =>
        f.name !== fileToClose.name || f.folderName !== fileToClose.folderName
    );
    setOpenFiles(updatedTabs);
    if (activeFile?.name === fileToClose.name && 
        activeFile?.folderName === fileToClose.folderName) {
      setActiveFile(updatedTabs[0] || null);
    }
  };

  return (
    <div className="flex bg-[#21232f] border-b border-[#e4e6f3ab] overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={`${file.folderName}-${file.name}`}
          className={`flex items-center px-4 py-2 text-sm cursor-pointer border-r border-[#e4e6f3ab] transition-all ${
            activeFile === file
              ? "bg-[#3D415A] text-white font-bold"
              : "bg-[#21232f] text-gray-400 hover:bg-[#3d415ab2]"
          }`}
          onClick={() => setActiveFile(file)}
        >
          <span className="mr-2">{file.name}</span>
          <button
            onClick={(e) => closeTab(e, file)}
            className="hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
