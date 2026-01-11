/**
 * EditorPaneLSP - Monaco Editor with LSP Integration
 *
 * Provides code completion, hover information, diagnostics display,
 * and go-to-definition functionality via the Language Server Protocol.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { lspManager, CompletionItemKind, DiagnosticSeverity } from "@/lib/lsp/LSPManager";
import type { Diagnostic, CompletionItem } from "@/lib/lsp/LSPManager";

interface EditorPaneLSPProps {
  value: string;
  language: string;
  filePath: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  onSave?: () => void;
}

// Map LSP completion kinds to Monaco completion kinds
function mapCompletionKind(kind: CompletionItemKind): number {
  const map: Record<number, number> = {
    [CompletionItemKind.Text]: 1,
    [CompletionItemKind.Method]: 0,
    [CompletionItemKind.Function]: 1,
    [CompletionItemKind.Constructor]: 2,
    [CompletionItemKind.Field]: 3,
    [CompletionItemKind.Variable]: 4,
    [CompletionItemKind.Class]: 5,
    [CompletionItemKind.Interface]: 7,
    [CompletionItemKind.Module]: 8,
    [CompletionItemKind.Property]: 9,
    [CompletionItemKind.Unit]: 10,
    [CompletionItemKind.Value]: 11,
    [CompletionItemKind.Enum]: 12,
    [CompletionItemKind.Keyword]: 13,
    [CompletionItemKind.Snippet]: 14,
    [CompletionItemKind.Color]: 15,
    [CompletionItemKind.File]: 16,
    [CompletionItemKind.Reference]: 17,
  };
  return map[kind] ?? 1;
}

// Map LSP diagnostic severity to Monaco marker severity
function mapDiagnosticSeverity(severity: DiagnosticSeverity): number {
  const map: Record<number, number> = {
    [DiagnosticSeverity.Error]: 8,
    [DiagnosticSeverity.Warning]: 4,
    [DiagnosticSeverity.Information]: 2,
    [DiagnosticSeverity.Hint]: 1,
  };
  return map[severity] ?? 2;
}

export function EditorPaneLSP({
  value,
  language,
  filePath,
  onChange,
  readOnly = false,
  onSave,
}: EditorPaneLSPProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const versionRef = useRef(1);
  const [diagnosticCount, setDiagnosticCount] = useState({ errors: 0, warnings: 0 });

  // Generate URI from file path
  const documentUri = `file://${filePath}`;

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register document with LSP
    lspManager.didOpenTextDocument({
      uri: documentUri,
      languageId: language,
      version: versionRef.current,
      text: value,
    });

    // Register completion provider
    const completionDisposable = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [".", "/", "<", '"', "'", "@", "#"],
      provideCompletionItems: async (model, position) => {
        const completions = await lspManager.provideCompletions(documentUri, {
          line: position.lineNumber - 1,
          character: position.column - 1,
        });

        return {
          suggestions: completions.map((item: CompletionItem) => ({
            label: item.label,
            kind: mapCompletionKind(item.kind),
            detail: item.detail,
            documentation: item.documentation,
            insertText: item.insertText || item.label,
            sortText: item.sortText,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          })),
        };
      },
    });

    // Register hover provider
    const hoverDisposable = monaco.languages.registerHoverProvider(language, {
      provideHover: async (model, position) => {
        const hover = await lspManager.provideHover(documentUri, {
          line: position.lineNumber - 1,
          character: position.column - 1,
        });

        if (!hover) return null;

        return {
          contents: [{ value: hover.contents }],
          range: hover.range
            ? {
                startLineNumber: hover.range.start.line + 1,
                startColumn: hover.range.start.character + 1,
                endLineNumber: hover.range.end.line + 1,
                endColumn: hover.range.end.character + 1,
              }
            : undefined,
        };
      },
    });

    // Register definition provider
    const definitionDisposable = monaco.languages.registerDefinitionProvider(language, {
      provideDefinition: async (model, position) => {
        const definition = await lspManager.gotoDefinition(documentUri, {
          line: position.lineNumber - 1,
          character: position.column - 1,
        });

        if (!definition) return null;

        // Handle Location or Location[]
        const locations = Array.isArray(definition) ? definition : [definition];

        return locations.map((loc: any) => ({
          uri: monaco.Uri.parse(loc.uri),
          range: {
            startLineNumber: loc.range.start.line + 1,
            startColumn: loc.range.start.character + 1,
            endLineNumber: loc.range.end.line + 1,
            endColumn: loc.range.end.character + 1,
          },
        }));
      },
    });

    // Add keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });

    // Add keyboard shortcut for format document
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, async () => {
      const edits = await lspManager.formatDocument(documentUri);
      if (edits.length > 0) {
        const model = editor.getModel();
        if (model) {
          model.pushEditOperations(
            [],
            edits.map((edit) => ({
              range: {
                startLineNumber: edit.range.start.line + 1,
                startColumn: edit.range.start.character + 1,
                endLineNumber: edit.range.end.line + 1,
                endColumn: edit.range.end.character + 1,
              },
              text: edit.newText,
            })),
            () => null
          );
        }
      }
    });

    // Cleanup on unmount
    return () => {
      completionDisposable.dispose();
      hoverDisposable.dispose();
      definitionDisposable.dispose();
      lspManager.didCloseTextDocument(documentUri);
    };
  }, [documentUri, language, value, onSave]);

  // Handle content changes
  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        versionRef.current++;
        lspManager.didChangeTextDocument(documentUri, newValue, versionRef.current);
      }
      onChange?.(newValue);
    },
    [documentUri, onChange]
  );

  // Subscribe to diagnostics updates
  useEffect(() => {
    const updateDiagnostics = (uri: string, diagnostics: Diagnostic[]) => {
      if (uri !== documentUri || !monacoRef.current || !editorRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      // Convert LSP diagnostics to Monaco markers
      const markers = diagnostics.map((diag) => ({
        severity: mapDiagnosticSeverity(diag.severity),
        startLineNumber: diag.range.start.line + 1,
        startColumn: diag.range.start.character + 1,
        endLineNumber: diag.range.end.line + 1,
        endColumn: diag.range.end.character + 1,
        message: diag.message,
        source: diag.source || "LSP",
        code: diag.code?.toString(),
      }));

      monacoRef.current.editor.setModelMarkers(model, "lsp", markers);

      // Update diagnostic count
      setDiagnosticCount({
        errors: diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error).length,
        warnings: diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning).length,
      });
    };

    const unsubscribe = lspManager.onDiagnostics(updateDiagnostics);

    // Initial diagnostics fetch
    const initialDiagnostics = lspManager.getDiagnostics(documentUri);
    if (initialDiagnostics.length > 0) {
      updateDiagnostics(documentUri, initialDiagnostics);
    }

    return unsubscribe;
  }, [documentUri]);

  return (
    <div className="h-full w-full flex flex-col" data-testid="editor-pane-lsp">
      {/* Diagnostic status bar */}
      {(diagnosticCount.errors > 0 || diagnosticCount.warnings > 0) && (
        <div className="flex items-center gap-4 px-3 py-1 bg-zinc-800 border-b border-zinc-700 text-xs">
          {diagnosticCount.errors > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {diagnosticCount.errors} error{diagnosticCount.errors !== 1 ? "s" : ""}
            </span>
          )}
          {diagnosticCount.warnings > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {diagnosticCount.warnings} warning{diagnosticCount.warnings !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: window.innerWidth > 1280 },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            readOnly,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            lineHeight: 22,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showMethods: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showUnits: true,
              showValues: true,
              showEnumMembers: true,
              showKeywords: true,
              showSnippets: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
            },
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            parameterHints: { enabled: true },
            folding: true,
            foldingStrategy: "indentation",
            showFoldingControls: "mouseover",
            matchBrackets: "always",
            occurrencesHighlight: "multiFile",
            renderWhitespace: "selection",
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}

export default EditorPaneLSP;
