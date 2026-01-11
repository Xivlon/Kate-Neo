import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Terminal as TerminalIcon, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TerminalPanelProps {
  height?: number;
}

export function TerminalPanel({ height = 300 }: TerminalPanelProps) {
  const [sessions, setSessions] = useState<string[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [output, setOutput] = useState<Map<string, string>>(new Map());
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Connect to terminal WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Terminal] WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'created':
          setSessions(prev => [...prev, message.sessionId]);
          setActiveSession(message.sessionId);
          setOutput(prev => {
            const newMap = new Map(prev);
            newMap.set(message.sessionId, '');
            return newMap;
          });
          break;

        case 'data':
          setOutput(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(message.sessionId) || '';
            newMap.set(message.sessionId, current + message.data);
            return newMap;
          });
          // Auto-scroll to bottom
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }, 0);
          break;

        case 'exit':
          toast({
            title: "Terminal exited",
            description: `Exit code: ${message.code}`,
          });
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('[Terminal] WebSocket error:', error);
      toast({
        title: "Terminal connection error",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.log('[Terminal] WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [toast]);

  const createTerminal = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create',
        config: {
          cwd: process.cwd || '.',
        },
      }));
    }
  };

  const closeTerminal = (sessionId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'kill',
      }));
    }
    setSessions(prev => prev.filter(s => s !== sessionId));
    setOutput(prev => {
      const newMap = new Map(prev);
      newMap.delete(sessionId);
      return newMap;
    });
    if (activeSession === sessionId) {
      setActiveSession(sessions.find(s => s !== sessionId) || null);
    }
  };

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget.value;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeSession) {
        wsRef.current.send(JSON.stringify({
          type: 'input',
          data: input + '\n',
        }));
        e.currentTarget.value = '';
      }
    }
  };

  const currentOutput = activeSession ? output.get(activeSession) || '' : '';

  return (
    <div 
      className="flex flex-col bg-black text-green-400 font-mono text-sm"
      style={{ height: `${height}px` }}
    >
      {/* Terminal Tabs */}
      <div className="flex items-center bg-gray-900 border-b border-gray-700 h-8">
        <div className="flex-1 flex items-center overflow-x-auto">
          {sessions.map((sessionId) => (
            <div
              key={sessionId}
              className={`flex items-center gap-2 px-3 py-1 cursor-pointer ${
                activeSession === sessionId 
                  ? 'bg-black text-green-400' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setActiveSession(sessionId)}
            >
              <TerminalIcon className="h-3 w-3" />
              <span className="text-xs">Terminal</span>
              <button
                className="hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(sessionId);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-gray-400 hover:text-white"
          onClick={createTerminal}
          title="New Terminal"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Terminal Output */}
      {activeSession ? (
        <>
          <div
            ref={terminalRef}
            className="flex-1 p-2 overflow-y-auto whitespace-pre-wrap"
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            {currentOutput || 'Terminal ready. Type commands and press Enter.\n'}
          </div>

          {/* Input Line */}
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-900 border-t border-gray-700">
            <span className="text-green-400">$</span>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-green-400"
              placeholder="Type command..."
              onKeyDown={handleInput}
              autoFocus
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <TerminalIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No terminal session</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={createTerminal}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Terminal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
