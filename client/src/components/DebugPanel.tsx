import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Square, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Breakpoint {
  id: string;
  line: number;
  source: string;
  verified: boolean;
}

interface StackFrame {
  id: number;
  name: string;
  source: string;
  line: number;
  column: number;
}

interface Variable {
  name: string;
  value: string;
  type?: string;
}

interface DebugPanelProps {
  onBreakpointToggle?: (source: string, line: number) => void;
}

export function DebugPanel({ onBreakpointToggle }: DebugPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [stackFrames, setStackFrames] = useState<StackFrame[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const { toast } = useToast();

  const startDebugSession = async () => {
    try {
      const response = await fetch("/api/debug/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "node",
          name: "Debug Session",
          request: "launch",
          program: "${workspaceFolder}/index.js",
          stopOnEntry: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setIsRunning(true);
        toast({
          title: "Debug session started",
          description: `Session ID: ${data.sessionId}`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to start debug session",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const stopDebugSession = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/debug/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessionId(null);
      setIsRunning(false);
      setStackFrames([]);
      setVariables([]);
      toast({
        title: "Debug session stopped",
      });
    } catch (error) {
      toast({
        title: "Failed to stop debug session",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const continueExecution = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/debug/sessions/${sessionId}/continue`, {
        method: "POST",
      });
      toast({
        title: "Continuing execution",
      });
    } catch (error) {
      toast({
        title: "Failed to continue",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const pauseExecution = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/debug/sessions/${sessionId}/pause`, {
        method: "POST",
      });
      toast({
        title: "Paused execution",
      });
    } catch (error) {
      toast({
        title: "Failed to pause",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="h-12 flex items-center justify-between px-4 border-b border-sidebar-border">
        <span className="text-sm font-medium uppercase text-muted-foreground">
          Debugger
        </span>
        <div className="flex gap-1">
          {!isRunning ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={startDebugSession}
              title="Start Debugging"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={continueExecution}
                title="Continue"
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={pauseExecution}
                title="Pause"
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={stopDebugSession}
                title="Stop"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                size="icon"
                variant="ghost"
                title="Step Over"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Step Into"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="Step Out"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Breakpoints */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">BREAKPOINTS</h3>
            <div className="space-y-1">
              {breakpoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No breakpoints set</p>
              ) : (
                breakpoints.map((bp) => (
                  <div
                    key={bp.id}
                    className="text-xs py-1 px-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${bp.verified ? 'bg-red-500' : 'bg-gray-500'}`} />
                      <span>{bp.source}:{bp.line}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Call Stack */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">CALL STACK</h3>
            <div className="space-y-1">
              {stackFrames.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {isRunning ? "Running..." : "Not debugging"}
                </p>
              ) : (
                stackFrames.map((frame) => (
                  <div
                    key={frame.id}
                    className="text-xs py-1 px-2 rounded hover:bg-accent cursor-pointer"
                  >
                    <div className="font-medium">{frame.name}</div>
                    <div className="text-muted-foreground">
                      {frame.source}:{frame.line}:{frame.column}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Variables */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-muted-foreground">VARIABLES</h3>
            <div className="space-y-1">
              {variables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {isRunning ? "No variables in scope" : "Not debugging"}
                </p>
              ) : (
                variables.map((variable, index) => (
                  <div
                    key={index}
                    className="text-xs py-1 px-2 rounded hover:bg-accent"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{variable.name}</span>
                      <span className="text-muted-foreground">{variable.value}</span>
                    </div>
                    {variable.type && (
                      <div className="text-muted-foreground text-[10px]">{variable.type}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
