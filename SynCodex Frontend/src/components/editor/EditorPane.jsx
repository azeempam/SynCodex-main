import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { debounce } from "lodash";
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

  // Fetch file content from backend
  useEffect(() => {
    const loadContent = async () => {
      if (!activeFile || !projectId) return;

      setIsLoading(true);
      try {
        const response = await API.post(
          "/api/projects/get-file-content",
          {
            folderName: activeFile.folderName,
            fileName: activeFile.name,
          },
          {
            headers: {
              email: localStorage.getItem("email"),
              projectid: projectId,
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
  }, [activeFile, projectId]);

  // Debounced save to backend
  const saveFileContent = debounce(async (content) => {
    if (!activeFile || !projectId) return;

    try {
      await API.put(
        "/api/projects/update-file-content",
        {
          folderName: activeFile.folderName,
          fileName: activeFile.name,
          content,
        },
        {
          headers: {
            email: localStorage.getItem("email"),
            projectid: projectId,
            token: localStorage.getItem("token"),
          },
        }
      );
    } catch (error) {
      console.error("Error saving content:", error);
    }
  }, 1000);

  const handleChange = (newValue) => {
    setValue(newValue);
    saveFileContent(newValue);
    if (onCodeChange) onCodeChange(newValue);
  };

  const getLanguage = () => {
    try {
      const fileName = activeFile.name;
      if (fileName.endsWith(".html")) return "html";
      if (fileName.endsWith(".css")) return "css";
      if (fileName.endsWith(".js") || activeFile.endsWith(".jsx"))
        return "javascript";
      if (fileName.endsWith(".ts") || activeFile.endsWith(".tsx"))
        return "typescript";
      if (fileName.endsWith(".py")) return "python";
      if (fileName.endsWith(".java")) return "java";
      if (fileName.endsWith(".c") || activeFile.endsWith(".cpp")) return "cpp";
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
  );
};
