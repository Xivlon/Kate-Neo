import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FileTree, type FileNode } from "@/components/FileTree";
import { TabBar, type Tab } from "@/components/TabBar";
import { EditorPane } from "@/components/EditorPane";
import { TopMenuBar } from "@/components/TopMenuBar";
import { StatusBar } from "@/components/StatusBar";
import { FindReplaceDialog } from "@/components/FindReplaceDialog";
import { DebugPanel } from "@/components/DebugPanel";
import { SourceControlPanel } from "@/components/SourceControlPanel";
import { TerminalPanel } from "@/components/TerminalPanel";
import { fileSystem } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, GitBranch, Bug, Terminal as TerminalIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CodeEditor() {
  const [files, setFiles] = useState<FileNode[]>(fileSystem.getFiles());
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>();
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [isFindDialogOpen, setIsFindDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("files");
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  // Always use dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Load file contents when file system changes
  useEffect(() => {
    setFiles(fileSystem.getFiles());
  }, []);

  const refreshFiles = () => {
    setFiles([...fileSystem.getFiles()]);
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.type === "file") {
      // Add to tabs if not already open
      if (!openTabs.find((t) => t.id === file.id)) {
        setOpenTabs([...openTabs, { id: file.id, name: file.name }]);
        if (file.content) {
          setFileContents(prev => {
            const newMap = new Map(prev);
            newMap.set(file.id, file.content!);
            return newMap;
          });
        }
      }
      setActiveTabId(file.id);
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : undefined);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      setFileContents(prev => {
        const newMap = new Map(prev);
        newMap.set(activeTabId, value);
        return newMap;
      });
      
      // Mark tab as dirty
      setOpenTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, isDirty: true } : tab
      ));
    }
  };

  const handleSave = () => {
    if (activeTabId) {
      setFileContents(prev => {
        const content = prev.get(activeTabId);
        if (content !== undefined) {
          if (fileSystem.updateFileContent(activeTabId, content)) {
            setOpenTabs(prevTabs => prevTabs.map(tab => 
              tab.id === activeTabId ? { ...tab, isDirty: false } : tab
            ));
            refreshFiles();
            toast({
              title: "File saved",
              description: "Your changes have been saved successfully.",
            });
          } else {
            toast({
              title: "Save failed",
              description: "Could not save the file.",
              variant: "destructive",
            });
          }
        }
        return prev;
      });
    }
  };

  const handleNewFile = () => {
    if (newFileName.trim()) {
      const newFile = fileSystem.createFile(null, newFileName.trim());
      if (newFile) {
        refreshFiles();
        setNewFileName("");
        setNewFileDialogOpen(false);
        toast({
          title: "File created",
          description: `${newFileName} has been created.`,
        });
        // Open the new file
        handleFileSelect(newFile);
      } else {
        toast({
          title: "Create failed",
          description: "Could not create the file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      if (fileSystem.createFolder(null, newFolderName.trim())) {
        refreshFiles();
        setNewFolderName("");
        setNewFolderDialogOpen(false);
        toast({
          title: "Folder created",
          description: `${newFolderName} has been created.`,
        });
      } else {
        toast({
          title: "Create failed",
          description: "Could not create the folder.",
          variant: "destructive",
        });
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            handleSave();
            break;
          case "n":
            e.preventDefault();
            setNewFileDialogOpen(true);
            break;
          case "f":
            e.preventDefault();
            setIsFindDialogOpen(true);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, fileContents, openTabs]);

  const activeFile = activeTabId ? fileSystem.findFileById(activeTabId) : null;
  const activeContent = activeTabId ? fileContents.get(activeTabId) || "" : "";

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopMenuBar
        onNewFile={() => setNewFileDialogOpen(true)}
        onNewFolder={() => setNewFolderDialogOpen(true)}
        onSave={handleSave}
        onSearch={() => setIsFindDialogOpen(true)}
        onSettings={() => console.log("Settings")}
        onGithubConnect={() => {
          toast({
            title: "GitHub Integration",
            description: "GitHub repository connection will be available soon.",
          });
        }}
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {!sidebarCollapsed && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="h-full flex flex-col">
                  <div className="border-b border-sidebar-border bg-sidebar">
                    <TabsList className="w-full justify-start rounded-none h-12 bg-transparent p-0">
                      <TabsTrigger 
                        value="files" 
                        className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                      >
                        <Files className="h-4 w-4 mr-2" />
                        Files
                      </TabsTrigger>
                      <TabsTrigger 
                        value="git" 
                        className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                      >
                        <GitBranch className="h-4 w-4 mr-2" />
                        Git
                      </TabsTrigger>
                      <TabsTrigger 
                        value="debug" 
                        className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                      >
                        <Bug className="h-4 w-4 mr-2" />
                        Debug
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
                    <FileTree
                      files={files}
                      selectedFileId={activeTabId}
                      onFileSelect={handleFileSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="git" className="flex-1 m-0 overflow-hidden">
                    <SourceControlPanel />
                  </TabsContent>
                  
                  <TabsContent value="debug" className="flex-1 m-0 overflow-hidden">
                    <DebugPanel />
                  </TabsContent>
                </Tabs>
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
            </>
          )}

          <Panel defaultSize={80}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={terminalVisible ? 70 : 100}>
                <div className="h-full flex flex-col">
                  {openTabs.length > 0 && (
                    <TabBar
                      tabs={openTabs}
                      activeTabId={activeTabId}
                      onTabSelect={setActiveTabId}
                      onTabClose={handleTabClose}
                    />
                  )}
                  
                  <div className="flex-1 relative">
                    {activeFile && activeFile.type === "file" ? (
                      <EditorPane
                        value={activeContent}
                        language={activeFile.language || "plaintext"}
                        onChange={handleEditorChange}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <p className="text-lg mb-2">No file open</p>
                          <p className="text-sm">Select a file from the explorer to start editing</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-4 h-6 bg-sidebar border-t border-sidebar-border">
                    <StatusBar
                      line={1}
                      column={1}
                      language={activeFile?.language || "plaintext"}
                      encoding="UTF-8"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 text-xs"
                      onClick={() => setTerminalVisible(!terminalVisible)}
                    >
                      <TerminalIcon className="h-3 w-3 mr-1" />
                      Terminal
                    </Button>
                  </div>
                </div>
              </Panel>
              
              {terminalVisible && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors cursor-row-resize" />
                  <Panel defaultSize={30} minSize={20}>
                    <TerminalPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* New File Dialog */}
      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent data-testid="dialog-new-file">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>
              Enter a name for your new file. Include the extension (e.g., .c, .cpp, .sql)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input
                id="file-name"
                placeholder="main.c"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewFile();
                }}
                data-testid="input-new-file-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewFile} data-testid="button-create-file">
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent data-testid="dialog-new-folder">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="my-folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNewFolder();
                }}
                data-testid="input-new-folder-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewFolder} data-testid="button-create-folder">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find/Replace Dialog - Note: Monaco Editor has built-in find/replace with Ctrl+F */}
      <FindReplaceDialog
        open={isFindDialogOpen}
        onOpenChange={setIsFindDialogOpen}
        onFind={(text) => {
          // Monaco editor will handle the find functionality via Ctrl+F natively
          toast({
            title: "Find",
            description: "Use Ctrl+F in the editor for advanced find features",
          });
        }}
        onReplace={(find, replace) => {
          toast({
            title: "Replace",
            description: "Use Ctrl+H in the editor for find and replace",
          });
        }}
        onReplaceAll={(find, replace) => {
          toast({
            title: "Replace All",
            description: "Use Ctrl+H in the editor for find and replace",
          });
        }}
      />
    </div>
  );
}
