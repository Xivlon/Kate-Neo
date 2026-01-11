/**
 * KateEditorPanel - Kate text editor integration component
 * 
 * Integrates the Kate text editor engine with the frontend via WebSocket bridge.
 * Provides advanced text editing capabilities, syntax highlighting, and code folding.
 */

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useKateBridge } from "@/hooks/useKateBridge";

interface KateEditorPanelProps {
  /** File path being edited */
  filePath?: string;
  /** Initial content of the file */
  content?: string;
  /** Language mode for syntax highlighting */
  language?: string;
  /** Callback when content changes */
  onChange?: (content: string) => void;
}

/**
 * Kate Editor Panel Component
 * 
 * Connects to the Kate engine backend via WebSocket to provide:
 * - Advanced text editing capabilities
 * - Sophisticated syntax highlighting from Kate
 * - Code folding and indentation
 * - Powerful search and replace
 * - Session management
 */
export function KateEditorPanel({
  filePath,
  content = "",
  language = "plaintext",
  onChange,
}: KateEditorPanelProps) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [documentId] = useState(`doc-${Date.now()}`);
  const [syntaxTokens, setSyntaxTokens] = useState<any[]>([]);
  const [foldingRegions, setFoldingRegions] = useState<any[]>([]);

  const kateBridge = useKateBridge({
    onConnected: (status) => {
      console.log("[KateEditorPanel] Connected to Kate bridge:", status);
      toast({
        title: status.kateAvailable ? "Kate Engine Connected" : "Kate Engine Unavailable",
        description: status.kateAvailable 
          ? `Kate ${status.version} is available`
          : "Running in fallback mode without KTextEditor",
      });
    },
    onDisconnected: () => {
      console.log("[KateEditorPanel] Disconnected from Kate bridge");
    },
    onError: (error) => {
      console.error("[KateEditorPanel] Kate bridge error:", error);
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Open document when component mounts or file changes
  useEffect(() => {
    if (!kateBridge.status.connected || !filePath) {
      return;
    }

    console.log(`[KateEditorPanel] Opening document: ${filePath}`);
    kateBridge.openDocument(documentId, filePath, content, language);

    // Request syntax highlighting
    if (kateBridge.status.kateAvailable) {
      kateBridge.requestSyntaxHighlighting(documentId, 0, 100)
        .then(tokens => {
          console.log(`[KateEditorPanel] Received ${tokens.length} syntax tokens`);
          setSyntaxTokens(tokens);
        })
        .catch(error => {
          console.error("[KateEditorPanel] Error getting syntax tokens:", error);
        });

      // Request folding regions
      kateBridge.requestFoldingRegions(documentId)
        .then(regions => {
          console.log(`[KateEditorPanel] Received ${regions.length} folding regions`);
          setFoldingRegions(regions);
        })
        .catch(error => {
          console.error("[KateEditorPanel] Error getting folding regions:", error);
        });
    }

    return () => {
      console.log(`[KateEditorPanel] Closing document: ${filePath}`);
      kateBridge.closeDocument(documentId);
    };
  }, [
    kateBridge.status.connected,
    kateBridge.status.kateAvailable,
    kateBridge.openDocument,
    kateBridge.closeDocument,
    kateBridge.requestSyntaxHighlighting,
    kateBridge.requestFoldingRegions,
    filePath,
    documentId,
    content,
    language,
  ]);

  return (
    <div className="h-full flex flex-col border border-border rounded">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${kateBridge.status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {kateBridge.status.connected 
              ? (kateBridge.status.kateAvailable ? 'Kate Engine Active' : 'Fallback Mode')
              : 'Connecting...'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {filePath || 'No file'}
        </div>
      </div>

      <div ref={editorRef} className="flex-1 p-4 bg-background/50 overflow-auto">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">
              {kateBridge.status.kateAvailable ? '✓ Kate Editor Integration' : '⚠ Kate Editor (Fallback Mode)'}
            </p>
            <p className="mb-2">
              {kateBridge.status.kateAvailable 
                ? `Connected to Kate ${kateBridge.status.version}. Advanced features are available.`
                : 'Kate native module not available. Running in fallback mode with limited features.'}
            </p>
            
            <div className="mt-4 space-y-1 font-mono text-xs">
              <p><strong>Active Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li className={kateBridge.status.kateAvailable ? 'text-green-600' : 'text-yellow-600'}>
                  Syntax highlighting {kateBridge.status.kateAvailable ? `(${syntaxTokens.length} tokens)` : '(Monaco fallback)'}
                </li>
                <li className={kateBridge.status.kateAvailable ? 'text-green-600' : 'text-yellow-600'}>
                  Code folding {kateBridge.status.kateAvailable ? `(${foldingRegions.length} regions)` : '(basic)'}
                </li>
                <li className={kateBridge.status.connected ? 'text-green-600' : 'text-gray-400'}>
                  Buffer synchronization
                </li>
              </ul>
            </div>

            {filePath && (
              <div className="mt-4 p-2 bg-background rounded border border-border">
                <p className="text-xs"><strong>Document:</strong> {filePath}</p>
                <p className="text-xs"><strong>Language:</strong> {language}</p>
                <p className="text-xs"><strong>Content:</strong> {content.length} characters</p>
                {kateBridge.status.kateAvailable && (
                  <>
                    <p className="text-xs"><strong>Syntax Tokens:</strong> {syntaxTokens.length}</p>
                    <p className="text-xs"><strong>Folding Regions:</strong> {foldingRegions.length}</p>
                  </>
                )}
              </div>
            )}

            {kateBridge.status.kateAvailable && syntaxTokens.length > 0 && (
              <div className="mt-4 p-2 bg-background rounded border border-border">
                <p className="text-xs font-semibold mb-1">Sample Syntax Tokens (first 5):</p>
                <div className="text-xs font-mono space-y-1">
                  {syntaxTokens.slice(0, 5).map((token, i) => (
                    <div key={i} className="text-xs">
                      Line {token.line}, Col {token.startColumn}-{token.endColumn}: {token.tokenType}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
