import { X, Circle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, DragEvent } from "react";

export interface Tab {
  id: string;
  name: string;
  isDirty?: boolean;
  language?: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder?: (sourceIndex: number, targetIndex: number) => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onTabReorder
}: TabBarProps) {
  const [dragState, setDragState] = useState<{
    draggedIndex: number | null;
    dropIndex: number | null;
  }>({
    draggedIndex: null,
    dropIndex: null
  });

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDragState(prev => ({ ...prev, draggedIndex: index }));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragState.draggedIndex === null || dragState.draggedIndex === index) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Determine if we're in the left or right half
    const dropIndex = x < width / 2 ? index : index + 1;

    setDragState(prev => ({ ...prev, dropIndex }));
    e.dataTransfer.dropEffect = 'move';
  }, [dragState.draggedIndex]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (dragState.draggedIndex !== null && dragState.dropIndex !== null && onTabReorder) {
      const adjustedDropIndex = dragState.dropIndex > dragState.draggedIndex
        ? dragState.dropIndex - 1
        : dragState.dropIndex;

      if (adjustedDropIndex !== dragState.draggedIndex) {
        onTabReorder(dragState.draggedIndex, adjustedDropIndex);
      }
    }

    setDragState({ draggedIndex: null, dropIndex: null });
  }, [dragState, onTabReorder]);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggedIndex: null, dropIndex: null });
  }, []);

  const getTabTypeIcon = (tab: Tab): string => {
    const ext = tab.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mmd':
      case 'mermaid':
        return '📊';
      case 'excalidraw':
        return '🎨';
      case 'scad':
        return '📦';
      case 'java':
        return '☕';
      default:
        return '';
    }
  };

  return (
    <div
      className="h-10 flex items-center bg-card border-b border-card-border overflow-x-auto"
      data-testid="tab-bar"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {tabs.map((tab, index) => {
        const isDragging = dragState.draggedIndex === index;
        const showDropBefore = dragState.dropIndex === index && dragState.draggedIndex !== null;
        const showDropAfter = dragState.dropIndex === index + 1 &&
          dragState.draggedIndex !== null &&
          index === tabs.length - 1;

        return (
          <div
            key={tab.id}
            className={`group h-full px-2 flex items-center gap-1 cursor-pointer border-r border-card-border transition-all duration-150
              ${activeTabId === tab.id
                ? "bg-background border-b-2 border-b-primary"
                : "text-muted-foreground hover:bg-accent/50"
              }
              ${isDragging ? "opacity-50" : ""}
              ${showDropBefore ? "border-l-2 border-l-primary" : ""}
              ${showDropAfter ? "border-r-2 border-r-primary" : ""}
            `}
            onClick={() => onTabSelect(tab.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            data-testid={`tab-${tab.id}`}
          >
            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab" />
            {tab.isDirty && <Circle className="w-2 h-2 fill-current text-orange-400" />}
            {tab.icon || (
              <span className="text-xs">{getTabTypeIcon(tab)}</span>
            )}
            <span className="text-xs font-mono whitespace-nowrap max-w-32 truncate">
              {tab.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              data-testid={`button-close-tab-${tab.id}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        );
      })}

      {tabs.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          No files open
        </div>
      )}
    </div>
  );
}
