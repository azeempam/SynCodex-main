import { FaPlay } from "react-icons/fa";
import { VscOpenPreview } from "react-icons/vsc";

export default function EditorNav({ onRunClick, onPreviewClick, isHtmlFile }) {
  return (
    <div className="flex items-center bg-[#21232f] h-16 px-4 border-b border-[#e4e6f3ab]">
      <h1 className="text-4xl font-bold font-Chakra font-gradient cursor-default">
        SynCodex
      </h1>
      <div className="w-full flex justify-center items-center">
        {isHtmlFile ? (
          <button
            className="bg-[#3D415A] hover:opacity-90 text-white p-3 rounded-lg cursor-pointer flex justify-center items-center"
            onClick={onPreviewClick}
            title="View Preview"
            aria-label="View Preview"
            type="button"
            name="View Preview"
          >
            <VscOpenPreview height={20}/>
          </button>
        ) : (
          <button
            className="bg-[#3D415A] hover:opacity-90 text-white p-3 rounded-lg cursor-pointer flex justify-center items-center"
            onClick={onRunClick}
            title="Run Code"
            aria-label="Run Code"
            type="button"
            name="Run Code"
          >
            <FaPlay height={20} />
          </button>
        )}
      </div>
    </div>
  );
}
