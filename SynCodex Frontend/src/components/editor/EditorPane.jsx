import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { debounce } from "lodash";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import API from "../../services/api";

import "monaco-editor/esm/vs/basic-languages/html/html.contribution";
import "monaco-editor/esm/vs/basic-languages/css/css.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
import "monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/esm/vs/basic-languages/sql/sql.contribution";
import "monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution";
import "monaco-editor/esm/vs/basic-languages/rust/rust.contribution";
import "monaco-editor/esm/vs/basic-languages/go/go.contribution";

export const EditorPane = ({ activeFile, onCodeChange, projectId }) => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    []
  );

  const getFilePath = () => {
    if (!activeFile?.name) return "";
    if (activeFile?.path) return activeFile.path.replace(/^\//, "");
    return activeFile.folderName
      ? `${activeFile.folderName}/${activeFile.name}`
      : activeFile.name;
  };

  // Fetch file content from backend
  useEffect(() => {
    const loadContent = async () => {
      if (!activeFile || !projectId) {
        setValue("");
        setIsLoading(false);
        setSaveStatus("idle");
        return;
      }

      setIsLoading(true);
      setSaveStatus("idle");
      try {
        const response = await API.get(
          `/api/files/read/${projectId}`,
          {
            params: {
              filePath: getFilePath(),
            },
            headers: {
              ...authHeaders,
            },
          }
        );

        setValue(response.data.content || "");
        if (onCodeChange) onCodeChange(response.data.content || "");
      } catch (error) {
        console.error("Error loading file:", error);
        setValue("");
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [activeFile, projectId, authHeaders]);

  // Debounced save to backend
  const saveFileContent = useMemo(
    () =>
      debounce(async (content, currentFile, currentProjectId) => {
        if (!currentFile || !currentProjectId) return;

        const filePath = currentFile?.path
          ? currentFile.path.replace(/^\//, "")
          : currentFile.folderName
          ? `${currentFile.folderName}/${currentFile.name}`
          : currentFile.name;

        try {
          await API.put(
            "/api/files/update",
            {
              projectId: currentProjectId,
              filePath,
              content,
            },
            {
              headers: {
                ...authHeaders,
              },
            }
          );
          setSaveStatus("saved");
        } catch (error) {
          console.error("Error saving content:", error);
          setSaveStatus("error");
        }
      }, 1000),
    [authHeaders]
  );

  useEffect(() => {
    return () => {
      saveFileContent.cancel();
    };
  }, [saveFileContent]);

  const handleChange = (newValue) => {
    const nextValue = newValue ?? "";
    setValue(nextValue);
    setSaveStatus("saving");
    saveFileContent(nextValue, activeFile, projectId);
    if (onCodeChange) onCodeChange(nextValue);
  };

  useEffect(() => {
    if (saveStatus !== "saved") return;

    const timeout = setTimeout(() => {
      setSaveStatus("idle");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [saveStatus]);

  const saveStatusChip = useMemo(() => {
    if (isLoading) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#21232f]/90 text-gray-200 text-xs border border-[#4C5068]">
          <Loader2 size={12} className="animate-spin" />
          Loading...
        </span>
      );
    }

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
  }, [isLoading, saveStatus]);

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
      if (fileName.endsWith(".c") || fileName.endsWith(".cpp")) return "cpp";
      return "plaintext";
    } catch (error) {
      return "plaintext";
    }
  };

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
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          fontFamily: "Fira Code, monospace",
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};
