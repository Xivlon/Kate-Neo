import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  GitCommit, 
  RefreshCw, 
  Plus, 
  Minus,
  FileText,
  FilePlus,
  FileX,
  GitPullRequest
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GitFileChange {
  path: string;
  status: string;
  staged: boolean;
}

interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

export function SourceControlPanel() {
  const [changes, setChanges] = useState<GitFileChange[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState("");
  const [history, setHistory] = useState<GitCommit[]>([]);
  const { toast } = useToast();

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/git/status");
      if (response.ok) {
        const data = await response.json();
        setChanges(data);
      }
    } catch (error) {
      console.error("Failed to load git status:", error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch("/api/git/branches");
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
        const current = data.find((b: GitBranch) => b.current);
        if (current) {
          setCurrentBranch(current.name);
        }
      }
    } catch (error) {
      console.error("Failed to load branches:", error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/git/history?limit=20");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  useEffect(() => {
    loadStatus();
    loadBranches();
    loadHistory();
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStage = async (filePath: string) => {
    try {
      const response = await fetch("/api/git/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (response.ok) {
        loadStatus();
        toast({
          title: "File staged",
          description: filePath,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to stage file",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleUnstage = async (filePath: string) => {
    try {
      const response = await fetch("/api/git/unstage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (response.ok) {
        loadStatus();
        toast({
          title: "File unstaged",
          description: filePath,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to unstage file",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast({
        title: "Commit message required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/git/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commitMessage }),
      });

      if (response.ok) {
        setCommitMessage("");
        loadStatus();
        loadHistory();
        toast({
          title: "Changes committed",
          description: commitMessage,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to commit",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleBranchChange = async (branchName: string) => {
    try {
      const response = await fetch("/api/git/branch/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchName }),
      });

      if (response.ok) {
        setCurrentBranch(branchName);
        loadStatus();
        loadBranches();
        toast({
          title: "Switched branch",
          description: branchName,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to switch branch",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'modified':
        return <FileText className="h-3 w-3 text-yellow-500" />;
      case 'added':
        return <FilePlus className="h-3 w-3 text-green-500" />;
      case 'deleted':
        return <FileX className="h-3 w-3 text-red-500" />;
      case 'untracked':
        return <FileText className="h-3 w-3 text-blue-500" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const stagedChanges = changes.filter(c => c.staged);
  const unstagedChanges = changes.filter(c => !c.staged);

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="h-12 flex items-center justify-between px-4 border-b border-sidebar-border">
        <span className="text-sm font-medium uppercase text-muted-foreground">
          Source Control
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            loadStatus();
            loadBranches();
            loadHistory();
          }}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Branch Selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            BRANCH
          </label>
          <Select value={currentBranch} onValueChange={handleBranchChange}>
            <SelectTrigger className="h-8">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3 w-3" />
                  <span className="text-sm">{currentBranch || "Select branch"}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {branches.filter(b => !b.remote).map((branch) => (
                <SelectItem key={branch.name} value={branch.name}>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3 w-3" />
                    {branch.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commit Box */}
        {stagedChanges.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              COMMIT MESSAGE
            </label>
            <Input
              placeholder="Commit message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  handleCommit();
                }
              }}
              className="h-8 mb-2"
            />
            <Button
              size="sm"
              onClick={handleCommit}
              className="w-full"
            >
              <GitCommit className="h-3 w-3 mr-2" />
              Commit ({stagedChanges.length})
            </Button>
          </div>
        )}

        <Separator />
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 pb-4 space-y-4">
          {/* Staged Changes */}
          {stagedChanges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                STAGED CHANGES ({stagedChanges.length})
              </h3>
              <div className="space-y-1">
                {stagedChanges.map((change) => (
                  <div
                    key={change.path}
                    className="text-xs py-1 px-2 rounded hover:bg-accent flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(change.status)}
                      <span className="truncate">{change.path}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => handleUnstage(change.path)}
                      title="Unstage"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unstaged Changes */}
          {unstagedChanges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                CHANGES ({unstagedChanges.length})
              </h3>
              <div className="space-y-1">
                {unstagedChanges.map((change) => (
                  <div
                    key={change.path}
                    className="text-xs py-1 px-2 rounded hover:bg-accent flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(change.status)}
                      <span className="truncate">{change.path}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => handleStage(change.path)}
                      title="Stage"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {changes.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">
              No changes detected
            </div>
          )}

          {history.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground">
                  RECENT COMMITS
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map((commit) => (
                    <div
                      key={commit.hash}
                      className="text-xs py-2 px-2 rounded hover:bg-accent"
                    >
                      <div className="font-medium truncate mb-1">{commit.message}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {commit.author} • {new Date(commit.date).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {commit.hash.substring(0, 7)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
