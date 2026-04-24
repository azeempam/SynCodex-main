import {
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { debounce } from "lodash";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import API from "../../services/api";

export const CollabEditorPane = forwardRef(
  ({ activeFile, yDoc, roomId, isInterviewMode }, ref) => {
    const editorRef = useRef(null);
    const bindingRef = useRef(null);
    const [value, setValue] = useState("");
    const [saveStatus, setSaveStatus] = useState("idle");

    const fileStorageKey = useMemo(() => {
      if (!activeFile) return null;
      return `file-${activeFile.path || activeFile.name}`;
    }, [activeFile]);

    const yText = useMemo(() => {
      if (yDoc && activeFile) {
        return yDoc.getText(activeFile.name);
      }
      return null;
    }, [yDoc, activeFile]);

    useImperativeHandle(ref, () => ({
      getCode: () => yText?.toString() || "",
    }));

    useEffect(() => {
      if (!activeFile) return;

      const storedContent = fileStorageKey
        ? localStorage.getItem(fileStorageKey)
        : "";
      setValue(storedContent || "");
      setSaveStatus("idle");

      if (editorRef.current) {
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }

        const model = editorRef.current.getModel();
        if (model) {
          bindingRef.current = new MonacoBinding(
            yText,
            model,
            new Set([editorRef.current]),
            yDoc.awareness
          );
          console.log(`Bound Monaco to Y.Text for file: ${activeFile}`);
        }
      }
    }, [activeFile, fileStorageKey, yDoc, yText]);

    const saveLocalDraft = useMemo(
      () =>
        debounce((newValue, storageKey) => {
          if (storageKey) {
            localStorage.setItem(storageKey, newValue);
          }
        }, 600),
      []
    );

    const persistRoomFile = useMemo(
      () =>
        debounce(async (newValue, currentFile, currentRoomId, interviewMode) => {
          if (interviewMode || !currentFile || !currentRoomId) {
            setSaveStatus("saved");
            return;
          }

          try {
            await API.put(
              "/api/rooms/update-file-content",
              {
                folderName: currentFile.folderName,
                fileName: currentFile.name,
                content: newValue,
              },
              {
                headers: {
                  email: localStorage.getItem("email"),
                  roomid: currentRoomId,
                  token: localStorage.getItem("token"),
                },
              }
            );
            setSaveStatus("saved");
          } catch (error) {
            console.error("Error saving content:", error);
            setSaveStatus("error");
          }
        }, 900),
      []
    );

    useEffect(() => {
      return () => {
        saveLocalDraft.cancel();
        persistRoomFile.cancel();
      };
    }, [saveLocalDraft, persistRoomFile]);

    const handleChange = (newValue) => {
      const nextValue = newValue ?? "";
      setValue(nextValue);
      setSaveStatus("saving");
      saveLocalDraft(nextValue, fileStorageKey);
      persistRoomFile(nextValue, activeFile, roomId, isInterviewMode);
    };

    useEffect(() => {
      if (saveStatus !== "saved") return;

      const timeout = setTimeout(() => {
        setSaveStatus("idle");
      }, 1500);

      return () => clearTimeout(timeout);
    }, [saveStatus]);

    const getLanguage = () => {
      try {
        const fileName = activeFile.name;
        if (fileName.endsWith(".html")) return "html";
        if (fileName.endsWith(".css")) return "css";
        if (fileName.endsWith(".js") || fileName.endsWith(".jsx"))
          return "javascript";
        if (fileName.endsWith(".ts") || fileName.endsWith(".tsx"))
          return "typescript";
        if (fileName.endsWith(".py")) return "python";
        if (fileName.endsWith(".java")) return "java";
        if (fileName.endsWith(".c") || fileName.endsWith(".cpp"))
          return "cpp";
        return "plaintext";
      } catch (error) {
        return "plaintext";
      }
    };

    const saveStatusChip = useMemo(() => {
      if (saveStatus === "saving") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#21232f]/90 text-blue-300 text-xs border border-blue-700/60">
            <Loader2 size={12} className="animate-spin" />
            Saving...
          </span>
        );
      }

      if (saveStatus === "saved") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#21232f]/90 text-emerald-300 text-xs border border-emerald-700/60">
            <CheckCircle2 size={12} />
            Saved
          </span>
        );
      }

      if (saveStatus === "error") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#21232f]/90 text-red-300 text-xs border border-red-700/60">
            <AlertCircle size={12} />
            Save failed
          </span>
        );
      }

      return null;
    }, [saveStatus]);

    const customTheme = {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#3D415A",
        "editor.foreground": "#ffffff",
        "editorLineNumber.foreground": "#E4E6F3",
        "editorLineNumber.activeForeground": "#FFFFFF",
        "editorGutter.background": "#21232f",
        "editorCursor.foreground": "#ffffff",
        "editor.selectionBackground": "#556177",
        "editor.lineHighlightBackground": "#4C5068",
      },
    };

    const handleEditorDidMount = (editor, monaco) => {
      editorRef.current = editor;
      monaco.editor.defineTheme("custom-dark", customTheme);
      monaco.editor.setTheme("custom-dark");

      if (bindingRef.current) bindingRef.current.destroy();

      if (yText) {
        bindingRef.current = new MonacoBinding(
          yText,
          editor.getModel(),
          new Set([editor]),
          yDoc.awareness
        );
        console.log(`Bound Monaco to Y.Text for file: ${activeFile}`);
      }
    };

    if (!activeFile) {
      return (
        <div className="h-full w-full flex items-center justify-center text-gray-300">
          Select a file to begin editing.
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
        <div className="absolute top-2 right-3 z-10">{saveStatusChip}</div>
        <Editor
          height="100%"
          language={getLanguage()}
          value={value}
          onChange={handleChange}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("custom-dark", customTheme);
          }}
          theme="custom-dark"
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: "Fira Code, monospace",
            minimap: { enabled: false },
            quickSuggestions: true,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>
    );
  }
);
