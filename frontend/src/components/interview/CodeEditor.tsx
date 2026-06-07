"use client";
import dynamic from "next/dynamic";
import { MONACO_LANGUAGE_MAP } from "../../lib/constants";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-bg flex items-center justify-center">
      <span className="text-muted text-sm">Loading editor...</span>
    </div>
  ),
});

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  code,
  language,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const monacoLanguage = MONACO_LANGUAGE_MAP[language] || "javascript";

  return (
    <MonacoEditor
      height="100%"
      language={monacoLanguage}
      value={code}
      onChange={(val) => onChange(val || "")}
      theme="vs-dark"
      options={{
        fontSize: 13,
        fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        readOnly,
        cursorBlinking: "smooth",
        renderLineHighlight: "line",
        bracketPairColorization: { enabled: true },
        suggest: { enabled: !readOnly },
        quickSuggestions: !readOnly,
      }}
    />
  );
}
