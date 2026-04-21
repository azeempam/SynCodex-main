import { X } from "lucide-react";

const CodeExecutionResult = ({ output, isRunning, onClose }) => {
  return (
    <pre className="bg-[#00000080] text-green-400 mt-2 p-3 rounded h-[30%] overflow-auto w-full flex items-start justify-between">
      {isRunning && (
        <div className="flex items-center justify-center mt-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          <span className="text-white">Running...</span>
        </div>
      )}
  
      {output}

      <button
        onClick={onClose}
        className="cursor-pointer max-h-6 max-w-6 flex items-center justify-center text-white p-1 rounded hover:bg-red-500 bg-[#3D415A] transition-all"
      >
        <X size={20} />
      </button>
    </pre>
  );
};

export default CodeExecutionResult;
