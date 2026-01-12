import { X, Circle, GripVertical, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, DragEvent, useRef, useEffect } from "react";
import { useResponsiveSpacing, useOverflowDetection } from "@/hooks/useResponsiveSpacing";
import { MIN_COMPONENT_WIDTHS } from "@/lib/spacing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Dynamic spacing based on container width
  const { containerRef, dimensions, isCompact, getFlexWidth } = useResponsiveSpacing({
    debounceDelay: 50,
  });

  // Track overflow state for scroll indicators
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { hasOverflow, canScrollStart, canScrollEnd } = useOverflowDetection(
    scrollContainerRef,
    { direction: 'horizontal' }
  );

  // Calculate dynamic tab width based on available space
  const getTabWidth = useCallback(() => {
    if (tabs.length === 0 || dimensions.width === 0) return MIN_COMPONENT_WIDTHS.tabWithClose;

    return getFlexWidth(
      tabs.length,
      MIN_COMPONENT_WIDTHS.tab,
      MIN_COMPONENT_WIDTHS.tabWithClose * 1.5, // max width
      4 // gap
    );
  }, [tabs.length, dimensions.width, getFlexWidth]);

  // Scroll by one tab width
  const scrollByTab = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabWidth = getTabWidth();
    const scrollAmount = direction === 'left' ? -tabWidth - 4 : tabWidth + 4;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, [getTabWidth]);

  // Ensure active tab is visible
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!activeTabId || !container) return;

    const activeTab = container.querySelector<HTMLElement>(`[data-tab-id="${activeTabId}"]`);
    if (!activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const isFullyVisible =
      tabRect.left >= containerRect.left && tabRect.right <= containerRect.right;

    if (!isFullyVisible) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [activeTabId]);

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

  // Calculate dynamic padding based on available space
  const tabPadding = isCompact ? 'px-1.5' : 'px-2';
  const tabGap = isCompact ? 'gap-0.5' : 'gap-1';

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="h-10 flex items-center bg-card border-b border-card-border"
      data-testid="tab-bar"
    >
      {/* Left scroll button */}
      {hasOverflow && canScrollStart && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-6 flex-shrink-0 rounded-none border-r border-card-border"
          onClick={() => scrollByTab('left')}
          data-testid="tab-scroll-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Scrollable tabs container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-hide min-w-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {tabs.map((tab, index) => {
          const isDragging = dragState.draggedIndex === index;
          const showDropBefore = dragState.dropIndex === index && dragState.draggedIndex !== null;
          const showDropAfter = dragState.dropIndex === index + 1 &&
            dragState.draggedIndex !== null &&
            index === tabs.length - 1;

          const tabContent = (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              className={`group h-full ${tabPadding} flex items-center ${tabGap} cursor-pointer border-r border-card-border transition-all duration-150 flex-shrink-0 min-w-0
                ${activeTabId === tab.id
                  ? "bg-background border-b-2 border-b-primary"
                  : "text-muted-foreground hover:bg-accent/50"
                }
                ${isDragging ? "opacity-50" : ""}
                ${showDropBefore ? "border-l-2 border-l-primary" : ""}
                ${showDropAfter ? "border-r-2 border-r-primary" : ""}
              `}
              style={{
                maxWidth: `${MIN_COMPONENT_WIDTHS.tabWithClose * 1.5}px`,
                minWidth: `${MIN_COMPONENT_WIDTHS.tab}px`,
              }}
              onClick={() => onTabSelect(tab.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              data-testid={`tab-${tab.id}`}
            >
              {!isCompact && (
                <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 cursor-grab flex-shrink-0" />
              )}
              {tab.isDirty && <Circle className="w-2 h-2 fill-current text-orange-400 flex-shrink-0" />}
              {tab.icon || (
                <span className="text-xs flex-shrink-0">{getTabTypeIcon(tab)}</span>
              )}
              <span className="text-xs font-mono whitespace-nowrap truncate min-w-0 flex-1">
                {tab.name}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 flex-shrink-0"
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

          // Wrap in tooltip when compact to show full name
          return isCompact ? (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                {tabContent}
              </TooltipTrigger>
              <TooltipContent className="font-mono text-xs">
                {tab.name}
              </TooltipContent>
            </Tooltip>
          ) : tabContent;
        })}
      </div>

      {/* Right scroll button */}
      {hasOverflow && canScrollEnd && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-6 flex-shrink-0 rounded-none border-l border-card-border"
          onClick={() => scrollByTab('right')}
          data-testid="tab-scroll-right"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Overflow menu for quick tab access when scrolling */}
      {hasOverflow && tabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 flex-shrink-0 rounded-none border-l border-card-border"
              data-testid="tab-overflow-menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => onTabSelect(tab.id)}
                className={`font-mono text-xs ${activeTabId === tab.id ? 'bg-accent' : ''}`}
              >
                {tab.isDirty && <Circle className="w-2 h-2 fill-current text-orange-400 mr-2" />}
                {tab.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {tabs.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
          No files open
        </div>
      )}
    </div>
  );
}
