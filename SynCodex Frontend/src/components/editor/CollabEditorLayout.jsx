import React, { useState, useEffect, useRef, useCallback } from "react";
import EditorNav from "./EditorNav";
import { FileExplorer } from "./FileExplorer";
import { FileTabs } from "./FileTabs";
import { PanelLeft, PanelRight } from "lucide-react";
import VideoCallSection from "../video_call/VideoCallSection";
import { SocketProvider } from "../../context/SocketProvider";
import { CollabEditorPane } from "./CollabEditorPane";
import { useYjsProvider } from "../../hooks/useYjsProvider";
import HtmlPreview from "./HtmlPreview";
import { runCode } from "../../services/codeExec";
import axios from "axios";
import EmotionMonitor from "../EmotionMonitor";
import TerminalComponent from "../terminal/TerminalComponent";
import EditorFooterBar from "./EditorFooterBar";
import useSyncedToggleState from "../../hooks/useSyncedToggleState";

export default function CollabEditorLayout({ roomId, isInterviewMode }) {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessionName, setSessionName] = useState("Loading...");
  const { yDoc, provider } = useYjsProvider(roomId);
  const collabEditorRef = useRef();
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useSyncedToggleState("syncodex.footer.terminal.open", true);
  const [isMoodAssistantOpen, setIsMoodAssistantOpen] = useSyncedToggleState("syncodex.footer.mood.open", true);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(0);

  const fetchRoomDetails = useCallback(async () => {
    if (!provider) return;

    const collabActions = JSON.parse(localStorage.getItem("collabActions") || "{}");
    const { action, hostEmail } = collabActions[roomId] || {};

    try {
      const response = await axios.get(
        "http://localhost:5000/api/rooms/room-details",
        {
          headers: {
            token: localStorage.getItem("token"),
            email: action === "joined" ? hostEmail : localStorage.getItem("email"),
            roomid: roomId,
          },
        }
      );

      const name = response?.data?.name || "Untitled Project";

      provider.awareness.setLocalStateField("sessionInfo", { name });
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  }, [provider, roomId]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateName = () => {
      const allStates = Array.from(awareness.getStates().values());
      const name = allStates.find((s) => s.sessionInfo)?.sessionInfo?.name;
      if (name) setSessionName(name);
      else setSessionName("Unnamed Session");
    };

    awareness.on("change", updateName);
    updateName(); // Initial run
    fetchRoomDetails(); // Fetch + Broadcast name

    return () => awareness.off("change", updateName);
  }, [provider, fetchRoomDetails, setSessionName]);

  useEffect(() => {
    setShowPreview(false);
  }, [activeFile?.name]);

  const handlePreviewClick = () => setShowPreview((prev) => !prev);
  const handleClosePreview = () => setShowPreview(false);

  const isHtmlFile = activeFile?.name?.endsWith?.(".html");

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
    if (!activeFile || !collabEditorRef.current) return;

    const code = collabEditorRef.current.getCode();
    const lang = detectLang(activeFile);
    if (!code || !lang) return;

    setIsTerminalVisible(true);
    setIsRunning(true);
    setOutput("");

    try {
      const result = await runCode(lang, code);
      setOutput(result.output || result.error || "// No output");
    } catch (err) {
      setOutput(err.message || "// Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleTerminalResizeStart = (event) => {
    event.preventDefault();
    resizeStartYRef.current = event.clientY;
    resizeStartHeightRef.current = terminalHeight;
    setIsResizingTerminal(true);
  };

  useEffect(() => {
    if (!isResizingTerminal) return;

    const handleMouseMove = (event) => {
      const delta = resizeStartYRef.current - event.clientY;
      const nextHeight = Math.min(420, Math.max(180, resizeStartHeightRef.current + delta));
      setTerminalHeight(nextHeight);
    };

    const handleMouseUp = () => setIsResizingTerminal(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingTerminal]);

  return (
    <>
      <EditorNav
        onRunClick={handleRunClick} 
        onPreviewClick={handlePreviewClick}
        isHtmlFile={!!isHtmlFile}
      />

      <EmotionMonitor sessionId={roomId} isVisible={isMoodAssistantOpen} />

      <div className="h-[calc(100vh-4rem)] pb-8 flex overflow-x-clip bg-[#21232f]">
        <div
          className={`h-full bg-[#21232f] transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-[255px]" : "w-0 overflow-hidden"
          }`}
        >
          {isSidebarOpen && (
            <FileExplorer
              yDoc={yDoc}
              openFiles={openFiles}
              setOpenFiles={setOpenFiles}
              setActiveFile={setActiveFile}
              roomOrProjectId={roomId}
              sessionName={sessionName}
              isInterviewMode={isInterviewMode}
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
              className="absolute top-16 left-2 flex z-20 bg-[#3D415A] hover:opacity-90 cursor-pointer text-white p-2 rounded-md transition-all duration-300"
            >
              {isSidebarOpen ? (
                <PanelLeft height={20} width={20} />
              ) : (
                <PanelRight height={20} width={20} />
              )}
            </button>
            {!isSidebarOpen && (
              <span className="ml-10 text-white text-sm font-semibold border-r px-4 py-2 border-[#e4e6f3ab]">
                {sessionName}
              </span>
            )}

            <FileTabs
              openFiles={openFiles}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              setOpenFiles={setOpenFiles}
            />
          </div>

          <div className="flex h-full overflow-hidden">
            <div
              className="pt-3 pr-2 h-full w-full flex flex-col justify-center"
              style={{
                width: isInterviewMode ? "100%" : "70%",
                transition: isInterviewMode ? "none" : "width 0.3s ease",
              }}
            >
              <div
                className={`h-full editor-wrapper flex-1 ${
                  isSidebarOpen ? "max-w-[calc(100%-2%)]" : "w-full"
                }`}
              >
                <CollabEditorPane
                  ref={collabEditorRef}
                  activeFile={activeFile}
                  yDoc={yDoc}
                  roomId={roomId}
                  isInterviewMode={isInterviewMode}
                />

                {showPreview && (
                  <div className="w-1/2 border-l border-gray-600">
                    <HtmlPreview rawHtml={collabEditorRef.current.getCode()} onClose={handleClosePreview} />
                  </div>
                )}
              </div>

              {isTerminalVisible && (
                <>
                  <div
                    role="separator"
                    aria-label="Resize terminal pane"
                    onMouseDown={handleTerminalResizeStart}
                    className="mt-2 h-1 cursor-row-resize rounded bg-[#2a2d2e] hover:bg-[#0e639c]"
                  />
                  <div style={{ height: `${terminalHeight}px` }} className="mt-2 min-h-0">
                    <TerminalComponent
                      projectId={roomId}
                      output={output}
                      isRunning={isRunning}
                      onClose={() => setIsTerminalVisible(false)}
                    />
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                width: isInterviewMode ? "auto" : "30%",
                flexShrink: 0,
                transition: isInterviewMode ? "none" : "width 0.3s ease",
              }}
            >
              <SocketProvider>
                <VideoCallSection
                  roomIdVCS={roomId}
                  isInterviewMode={isInterviewMode}
                />
              </SocketProvider>
            </div>
          </div>
        </div>
      </div>

      <EditorFooterBar
        isTerminalOpen={isTerminalVisible}
        isMoodAssistantOpen={isMoodAssistantOpen}
        onToggleTerminal={() => setIsTerminalVisible((prev) => !prev)}
        onToggleMoodAssistant={() => setIsMoodAssistantOpen((prev) => !prev)}
      />
    </>
  );
}
