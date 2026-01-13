/**
 * GridLayout Component
 *
 * A 4x4 grid container that renders panes using the Crystal Reflow algorithm.
 */

import { useCallback } from 'react';
import { useGridLayoutContext } from '@/contexts/GridLayoutContext';
import { GridPane as GridPaneType, getGridContainerStyles, GRID_GAP } from '@/lib/gridLayout';
import { GridPane } from './GridPane';
import { cn } from '@/lib/utils';

interface GridLayoutProps {
  /** Additional class names */
  className?: string;
  /** Render function for pane content */
  renderPane: (pane: GridPaneType) => React.ReactNode;
}

export function GridLayout({ className, renderPane }: GridLayoutProps) {
  const {
    state,
    reflowedPanes,
    setFocus,
    remove,
    resize,
    unlock,
    swapPanes,
    bringToFront,
  } = useGridLayoutContext();

  const handlePaneClick = useCallback((id: string) => {
    setFocus(id);
    bringToFront(id);
  }, [setFocus, bringToFront]);

  const handlePaneClose = useCallback((id: string) => {
    remove(id);
  }, [remove]);

  const handlePaneDrop = useCallback((sourceId: string, targetId: string) => {
    swapPanes(sourceId, targetId);
  }, [swapPanes]);

  // Empty workspace message
  if (reflowedPanes.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full w-full bg-background text-muted-foreground",
          className
        )}
      >
        <div className="text-center">
          <p className="text-lg mb-2">Empty Workspace</p>
          <p className="text-sm">Press Alt+Enter to create a new pane</p>
          <p className="text-xs mt-4 opacity-60">
            Alt+H/J/K/L to navigate | Alt+Q to close | Alt+1-9 for workspaces
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-background", className)}
      style={getGridContainerStyles()}
    >
      {reflowedPanes.map((pane) => (
        <GridPane
          key={pane.id}
          pane={pane}
          isFocused={state.focusedId === pane.id}
          onClick={() => handlePaneClick(pane.id)}
          onClose={() => handlePaneClose(pane.id)}
          onResize={(size) => resize(pane.id, size)}
          onUnlock={() => unlock(pane.id)}
          onDrop={(sourceId) => handlePaneDrop(sourceId, pane.id)}
        >
          {renderPane(pane)}
        </GridPane>
      ))}

      {/* Workspace indicator */}
      <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-none">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-4 h-4 flex items-center justify-center text-[10px] border transition-colors",
              i === state.workspace
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GridLayout;
