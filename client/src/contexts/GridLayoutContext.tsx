/**
 * Grid Layout Context
 *
 * Provides global access to the grid layout system,
 * allowing components to interact with panes.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useGridLayout, type UseGridLayoutResult } from '@/hooks/useGridLayout';
import { GridPane, GridPaneType } from '@/lib/gridLayout';

// Context value type
type GridLayoutContextValue = UseGridLayoutResult;

const GridLayoutContext = createContext<GridLayoutContextValue | null>(null);

interface GridLayoutProviderProps {
  children: ReactNode;
  /** Initial panes to render */
  initialPanes?: GridPane[];
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
}

export function GridLayoutProvider({
  children,
  initialPanes,
  enableKeyboard = true,
}: GridLayoutProviderProps) {
  const gridLayout = useGridLayout({
    initialPanes,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Alt+key combinations
      if (!e.altKey) return;

      // Prevent default for our shortcuts
      const handled = ['h', 'j', 'k', 'l', 'q', 'Enter', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key);
      if (handled) {
        e.preventDefault();
      }

      // Vim-style navigation
      if (e.key === 'h') gridLayout.moveFocus('h');
      if (e.key === 'j') gridLayout.moveFocus('j');
      if (e.key === 'k') gridLayout.moveFocus('k');
      if (e.key === 'l') gridLayout.moveFocus('l');

      // Close focused pane
      if (e.key === 'q') gridLayout.closeActive();

      // Spawn new editor
      if (e.key === 'Enter') gridLayout.spawn('EDITOR');

      // Workspace switching (Alt+1-9)
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        gridLayout.switchWorkspace(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, gridLayout]);

  return (
    <GridLayoutContext.Provider value={gridLayout}>
      {children}
    </GridLayoutContext.Provider>
  );
}

/**
 * Hook to access the grid layout system
 */
export function useGridLayoutContext(): GridLayoutContextValue {
  const context = useContext(GridLayoutContext);

  if (!context) {
    throw new Error('useGridLayoutContext must be used within a GridLayoutProvider');
  }

  return context;
}

/**
 * Hook to check if we're inside a GridLayoutProvider
 */
export function useIsGridLayoutEnabled(): boolean {
  const context = useContext(GridLayoutContext);
  return context !== null;
}

export default GridLayoutContext;
