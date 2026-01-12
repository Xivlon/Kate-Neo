import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FileCode, FileJson, FileText, Image, Database, Cpu, Box } from "lucide-react";
import { useState, useCallback, DragEvent, useRef } from "react";
import { useResponsiveSpacing } from "@/hooks/useResponsiveSpacing";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path?: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface DragDropState {
  draggedItem: FileNode | null;
  dropTarget: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

interface FileTreeProps {
  files: FileNode[];
  selectedFileId?: string;
  onFileSelect: (file: FileNode) => void;
  onFileCreate?: () => void;
  onFileDelete?: (file: FileNode) => void;
  onFileMove?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onExternalFileDrop?: (files: FileList, targetFolderId?: string) => void;
}

export function FileTree({
  files,
  selectedFileId,
  onFileSelect,
  onFileMove,
  onExternalFileDrop
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root", "src"]));
  const [dragState, setDragState] = useState<DragDropState>({
    draggedItem: null,
    dropTarget: null,
    dropPosition: null
  });

  // Dynamic spacing based on container width
  const { containerRef, dimensions, isCompact, getIndent } = useResponsiveSpacing({
    debounceDelay: 50,
  });

  // Calculate dynamic indentation based on container width
  const getDynamicIndent = useCallback((level: number) => {
    // Base padding for all items
    const basePadding = 8;
    // Get responsive indent that adjusts based on available width
    const levelIndent = getIndent(level, isCompact ? 10 : 14);
    return basePadding + levelIndent;
  }, [getIndent, isCompact]);

  // Calculate if text should be truncated more aggressively
  const shouldCompactView = dimensions.width > 0 && dimensions.width < 180;

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
      return expandedFolders.has(node.id)
        ? <FolderOpen className="w-4 h-4 text-yellow-500" />
        : <Folder className="w-4 h-4 text-yellow-500" />;
    }

    const ext = node.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-yellow-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-400" />;
      case 'sql':
        return <Database className="w-4 h-4 text-orange-400" />;
      case 'scad':
        return <Box className="w-4 h-4 text-green-400" />;
      case 'java':
        return <Cpu className="w-4 h-4 text-red-400" />;
      case 'mmd':
      case 'mermaid':
        return <FileCode className="w-4 h-4 text-pink-400" />;
      case 'excalidraw':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  // Drag handlers
  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, node: FileNode) => {
    e.dataTransfer.setData('application/json', JSON.stringify(node));
    e.dataTransfer.setData('text/plain', node.name);
    e.dataTransfer.effectAllowed = 'move';
    setDragState(prev => ({ ...prev, draggedItem: node }));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();

    // Don't allow dropping on self
    if (dragState.draggedItem?.id === node.id) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position: 'before' | 'after' | 'inside';
    if (node.type === 'folder') {
      if (y < height * 0.25) {
        position = 'before';
      } else if (y > height * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }
    } else {
      position = y < height / 2 ? 'before' : 'after';
    }

    setDragState(prev => ({
      ...prev,
      dropTarget: node.id,
      dropPosition: position
    }));

    e.dataTransfer.dropEffect = 'move';
  }, [dragState.draggedItem]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only clear if leaving the tree entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-testid="file-tree"]')) {
      setDragState(prev => ({
        ...prev,
        dropTarget: null,
        dropPosition: null
      }));
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetNode: FileNode) => {
    e.preventDefault();
    e.stopPropagation();

    // Check for external files
    if (e.dataTransfer.files.length > 0) {
      const targetFolder = targetNode.type === 'folder' ? targetNode.id : undefined;
      onExternalFileDrop?.(e.dataTransfer.files, targetFolder);
    } else if (dragState.draggedItem && dragState.dropPosition && onFileMove) {
      onFileMove(dragState.draggedItem.id, targetNode.id, dragState.dropPosition);
    }

    setDragState({
      draggedItem: null,
      dropTarget: null,
      dropPosition: null
    });
  }, [dragState, onFileMove, onExternalFileDrop]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedItem: null,
      dropTarget: null,
      dropPosition: null
    });
  }, []);

  // Handle drop on empty area (root level)
  const handleRootDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.files.length > 0) {
      onExternalFileDrop?.(e.dataTransfer.files);
    }

    setDragState({
      draggedItem: null,
      dropTarget: null,
      dropPosition: null
    });
  }, [onExternalFileDrop]);

  const getDropIndicatorStyle = (nodeId: string): string => {
    if (dragState.dropTarget !== nodeId) return '';

    switch (dragState.dropPosition) {
      case 'before':
        return 'border-t-2 border-t-primary';
      case 'after':
        return 'border-b-2 border-b-primary';
      case 'inside':
        return 'bg-primary/20 ring-1 ring-primary';
      default:
        return '';
    }
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;
    const isDragging = dragState.draggedItem?.id === node.id;
    const dropIndicator = getDropIndicatorStyle(node.id);

    // Calculate dynamic padding based on container width and nesting level
    const dynamicPadding = getDynamicIndent(level);

    // Determine gap size based on available space
    const gapClass = shouldCompactView ? "gap-1" : "gap-2";

    const fileItem = (
      <div
        className={`flex items-center ${gapClass} h-8 cursor-pointer text-sm transition-all duration-150 min-w-0
          ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
          ${isDragging ? "opacity-50" : ""}
          ${dropIndicator}
        `}
        style={{
          paddingLeft: `${dynamicPadding}px`,
          paddingRight: shouldCompactView ? '4px' : '8px'
        }}
        onClick={() => {
          if (node.type === "folder") {
            toggleFolder(node.id);
          } else {
            onFileSelect(node);
          }
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onDragOver={(e) => handleDragOver(e, node)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, node)}
        onDragEnd={handleDragEnd}
        data-testid={`file-tree-item-${node.id}`}
      >
        {node.type === "folder" && (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {node.type === "file" && <span className="w-4 flex-shrink-0" />}
        <span className="flex-shrink-0">{getFileIcon(node)}</span>
        <span className="flex-1 truncate font-mono text-xs min-w-0">{node.name}</span>
      </div>
    );

    return (
      <div key={node.id}>
        {/* Wrap in tooltip when in compact view to show full filename on hover */}
        {shouldCompactView ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {fileItem}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              {node.name}
            </TooltipContent>
          </Tooltip>
        ) : (
          fileItem
        )}
        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="h-full overflow-y-auto overflow-x-hidden"
      data-testid="file-tree"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleRootDrop}
    >
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          <Folder className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm text-center">Drop files here to get started</p>
        </div>
      ) : (
        files.map(file => renderNode(file))
      )}
    </div>
  );
}
