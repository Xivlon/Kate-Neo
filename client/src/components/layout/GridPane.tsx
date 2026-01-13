/**
 * GridPane Component
 *
 * Individual pane in the grid layout with drag support and context menu.
 */

import { useState, useCallback, useRef, type ReactNode, type DragEvent } from 'react';
import {
  GridPane as GridPaneType,
  PaneSize,
  PANE_CONFIGS,
  getPaneGridStyles,
  getSizeLabel,
} from '@/lib/gridLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { GripVertical, X, Lock, Unlock, Maximize2, Minimize2 } from 'lucide-react';

interface GridPaneProps {
  pane: GridPaneType;
  isFocused: boolean;
  children: ReactNode;
  onClick: () => void;
  onClose: () => void;
  onResize: (size: PaneSize) => void;
  onUnlock: () => void;
  onDrop: (sourceId: string) => void;
}

export function GridPane({
  pane,
  isFocused,
  children,
  onClick,
  onClose,
  onResize,
  onUnlock,
  onDrop,
}: GridPaneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  const config = PANE_CONFIGS[pane.type];
  const isLocked = pane.lockedSize && pane.lockedSize !== 'AUTO';
  const sizeLabel = getSizeLabel(pane);

  // Drag handlers
  const handleDragStart = useCallback((e: DragEvent) => {
    e.dataTransfer.setData('text/plain', pane.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }, [pane.id]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== pane.id) {
      onDrop(sourceId);
    }
  }, [pane.id, onDrop]);

  // Don't render hidden panes
  if (pane.cols === 0 || pane.rows === 0) {
    return null;
  }

  return (
    <div
      ref={paneRef}
      className={cn(
        "relative flex flex-col overflow-hidden transition-all duration-200",
        "bg-card border rounded-sm",
        isFocused ? "border-primary shadow-lg z-10" : "border-border",
        isDragging && "opacity-50",
        isDragOver && "border-primary border-dashed bg-primary/5"
      )}
      style={getPaneGridStyles(pane)}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Pane Header */}
      <div
        className={cn(
          "flex items-center justify-between px-2 py-1 text-xs select-none cursor-grab active:cursor-grabbing",
          "border-b bg-muted/50",
          isFocused ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3 w-3 opacity-50" />
          <span className="font-medium">{config.label}</span>
          {sizeLabel && (
            <span className="opacity-60 text-[10px]">{sizeLabel}</span>
          )}
          {isLocked && <Lock className="h-2.5 w-2.5 opacity-60" />}
        </div>

        <div className="flex items-center gap-1">
          {/* Size menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "p-0.5 rounded hover:bg-background/20 transition-colors",
                  isFocused ? "hover:bg-primary-foreground/20" : ""
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => onResize('MINI')}
                disabled={!config.valid.includes('MINI')}
              >
                <Minimize2 className="h-3 w-3 mr-2" />
                Mini (1×1)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onResize('STD')}
                disabled={!config.valid.includes('STD')}
              >
                Standard (2×1)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onResize('WIDE')}
                disabled={!config.valid.includes('WIDE')}
              >
                Wide (4×1)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onResize('TALL')}
                disabled={!config.valid.includes('TALL')}
              >
                Tall (2×2)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onUnlock}>
                <Unlock className="h-3 w-3 mr-2" />
                Auto (Elastic)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close button */}
          <button
            className={cn(
              "p-0.5 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors",
              isFocused ? "hover:bg-destructive" : ""
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default GridPane;
