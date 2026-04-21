import React, { useState, useEffect, useCallback } from "react";
import { FileTabs } from "../components/editor/FileTabs";
import { FileExplorer } from "../components/editor/FileExplorer";
import { EditorPane } from "../components/editor/EditorPane";
import EditorNav from "../components/editor/EditorNav";
import { PanelLeft, PanelRight } from "lucide-react";
import { runCode } from "../services/codeExec";
import CodeExecutionResult from "../components/editor/CodeExecutionResult";
import HtmlPreview from "../components/editor/HtmlPreview";
import { useParams } from "react-router-dom";
import API from "../services/api";
import useMeta from "../hooks/useMeta";

export default function EditorPage() {
  useMeta();
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projectName, setProjectName] = useState("Loading...");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { projectId } = useParams();

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await API.get(
        "/api/projects/project-details",
        {
          headers: {
            token: localStorage.getItem("token"),
            email: localStorage.getItem("email"),
            projectid: projectId,
          },
        }
      );

      setProjectName(response.data.name || "Untitled Project");
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  }, [projectId]);

  useEffect(() => {
    setShowPreview(false);
  }, [activeFile?.name]);

  const handlePreviewClick = () => setShowPreview((prev) => !prev);
  const handleClosePreview = () => setShowPreview(false);

  const isHtmlFile = activeFile?.name?.endsWith?.(".html");

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const detectLang = (file) => {
    if (!file?.name) return "plaintext";
    if (file?.name.endsWith(".py")) return "python";
    if (file?.name.endsWith(".js")) return "js";
    if (file?.name.endsWith(".ts")) return "ts";
    if (file?.name.endsWith(".java")) return "java";
    if (file?.name.endsWith(".cpp")) return "cpp";
    if (file?.name.endsWith(".c")) return "c";
    return "plaintext";
  };

  const handleRunClick = async () => {
    if (!code || !activeFile) return;
    const lang = detectLang(activeFile);
    setIsRunning(true);
    setShowOutput(true);
    setOutput("");
    try {
      const res = await runCode(lang, code);
      setOutput(res.output || res.error || "// No output");
    } catch (err) {
      setOutput(err.message || "// Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCloseOutput = () => {
    setShowOutput(false);
    setOutput("");
  };

  return (
    <>
      <EditorNav
        onRunClick={handleRunClick}
        onPreviewClick={handlePreviewClick}
        isHtmlFile={!!isHtmlFile}
      />

      <div className="h-[calc(100vh-4rem)] flex overflow-x-clip bg-[#21232f]">
        <div
          className={`h-full bg-[#21232f] transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-[255px]" : "w-0 overflow-hidden"
          }`}
        >
          {isSidebarOpen && (
            <FileExplorer
              openFiles={openFiles}
              setOpenFiles={setOpenFiles}
              setActiveFile={setActiveFile}
              sessionName={projectName}
              roomOrProjectId={projectId}
            />
          )}
        </div>

        <div className="flex flex-col flex-1 h-full">
          <div className="bg-[#21232f] flex items-center border-b border-[#e4e6f3ab]">
            <button
              title="toggle sidebar"
              aria-label="toggle sidebar"
              type="button"
              name="toggle sidebar"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute top-16 left-0 flex z-20 bg-[#3D415A] hover:opacity-90 cursor-pointer text-white p-2 rounded-md transition-all duration-300"
            >
              {isSidebarOpen ? (
                <PanelLeft height={20} width={20} />
              ) : (
                <PanelRight height={20} width={20} />
              )}
            </button>
            {!isSidebarOpen && (
              <span className="ml-10 text-white text-sm font-semibold border-r px-4 py-2 border-[#e4e6f3ab]">
                {projectName}
              </span>
            )}

            <FileTabs
              openFiles={openFiles}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              setOpenFiles={setOpenFiles}
            />
          </div>
          <div
            className={`pt-3 pb-${
              showOutput ? "0" : "3"
            } pr-2 h-full w-full flex flex-col justify-center`}
          >
            <div
              className={`h-full editor-wrapper flex-1 ${
                isSidebarOpen ? "max-w-[calc(100%-2%)]" : "w-full"
              }`}
            >
              <div className="flex h-full w-full">
                <div
                  className={`${
                    showPreview ? "w-1/2" : "w-full"
                  } transition-all duration-300`}
                >
                  <EditorPane activeFile={activeFile} onCodeChange={setCode} projectId={projectId}/>
                </div>

                {showPreview && (
                  <div className="w-1/2 border-l border-gray-600">
                    <HtmlPreview rawHtml={code} onClose={handleClosePreview} />
                  </div>
                )}
              </div>
            </div>
            {showOutput && (
              <CodeExecutionResult
                output={output}
                isRunning={isRunning}
                onClose={handleCloseOutput}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
