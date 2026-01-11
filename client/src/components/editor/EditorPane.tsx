import Editor from "@monaco-editor/react";

interface EditorPaneProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function EditorPane({ value, language, onChange, readOnly = false }: EditorPaneProps) {
  return (
    <div className="h-full w-full" data-testid="editor-pane">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: window.innerWidth > 1280 },
          fontSize: 16,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          readOnly,
          fontFamily: "JetBrains Mono, monospace",
          lineHeight: 24,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
      />
    </div>
  );
}
