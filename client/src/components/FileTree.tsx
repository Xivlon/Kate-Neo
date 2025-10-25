import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileTreeProps {
  files: FileNode[];
  selectedFileId?: string;
  onFileSelect: (file: FileNode) => void;
  onFileCreate?: () => void;
  onFileDelete?: (file: FileNode) => void;
}

export function FileTree({ files, selectedFileId, onFileSelect }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return expandedFolders.has(node.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />;
    }

    const ext = node.name.split(".").pop()?.toLowerCase();
    return <File className="w-4 h-4" />;
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 h-8 px-2 cursor-pointer text-sm hover-elevate ${
            isSelected ? "bg-accent text-accent-foreground" : ""
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
          data-testid={`file-tree-item-${node.id}`}
        >
          {node.type === "folder" && (
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
          {node.type === "file" && <span className="w-4" />}
          {getFileIcon(node)}
          <span className="flex-1 truncate font-mono text-xs">{node.name}</span>
        </div>
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="file-tree">
      {files.map(file => renderNode(file))}
    </div>
  );
}
