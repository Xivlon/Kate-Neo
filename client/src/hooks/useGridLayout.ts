/**
 * useGridLayout Hook
 *
 * Manages grid layout state with Crystal Reflow algorithm.
 * Provides actions for spawning, removing, resizing, and reordering panes.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  GridPane,
  GridPaneType,
  GridState,
  PaneSize,
  crystalReflow,
  createPane,
  PANE_CONFIGS,
} from '@/lib/gridLayout';

export interface UseGridLayoutOptions {
  /** Initial panes */
  initialPanes?: GridPane[];
  /** Number of workspaces (default: 9) */
  workspaceCount?: number;
  /** Callback when panes change */
  onPanesChange?: (panes: GridPane[]) => void;
}

export interface UseGridLayoutResult {
  /** Current grid state */
  state: GridState;
  /** Panes after reflow calculation */
  reflowedPanes: GridPane[];
  /** Spawn a new pane */
  spawn: (type: GridPaneType, data?: Record<string, unknown>) => void;
  /** Remove a pane by ID */
  remove: (id: string) => void;
  /** Close the focused pane */
  closeActive: () => void;
  /** Set pane size (lock) */
  resize: (id: string, size: PaneSize) => void;
  /** Unlock pane size (allow elastic expansion) */
  unlock: (id: string) => void;
  /** Set focused pane */
  setFocus: (id: string | null) => void;
  /** Navigate focus (vim-style) */
  moveFocus: (direction: 'h' | 'j' | 'k' | 'l') => void;
  /** Switch workspace */
  switchWorkspace: (index: number) => void;
  /** Swap two panes */
  swapPanes: (idA: string, idB: string) => void;
  /** Move pane to front (z-order) */
  bringToFront: (id: string) => void;
  /** Get pane by ID */
  getPane: (id: string) => GridPane | undefined;
  /** Check if pane type exists */
  hasPane: (type: GridPaneType) => boolean;
  /** Find pane by type */
  findPane: (type: GridPaneType) => GridPane | undefined;
}

export function useGridLayout(options: UseGridLayoutOptions = {}): UseGridLayoutResult {
  const {
    initialPanes = [],
    workspaceCount = 9,
    onPanesChange,
  } = options;

  // Initialize workspaces
  const [workspaces, setWorkspaces] = useState<GridPane[][]>(() => {
    const ws: GridPane[][] = Array(workspaceCount).fill(null).map(() => []);
    if (initialPanes.length > 0) {
      ws[0] = initialPanes;
    }
    return ws;
  });

  const [currentWorkspace, setCurrentWorkspace] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Current workspace panes
  const panes = workspaces[currentWorkspace];

  // Apply Crystal Reflow
  const reflowedPanes = useMemo(() => {
    return crystalReflow(panes);
  }, [panes]);

  // Update panes in current workspace
  const updatePanes = useCallback((newPanes: GridPane[]) => {
    setWorkspaces(prev => {
      const updated = [...prev];
      updated[currentWorkspace] = newPanes;
      return updated;
    });
    onPanesChange?.(newPanes);
  }, [currentWorkspace, onPanesChange]);

  // Spawn a new pane
  const spawn = useCallback((type: GridPaneType, data?: Record<string, unknown>) => {
    const newPane = createPane(type, data);
    const newPanes = [...panes, newPane];
    updatePanes(newPanes);
    setFocusedId(newPane.id);
  }, [panes, updatePanes]);

  // Remove a pane
  const remove = useCallback((id: string) => {
    const index = panes.findIndex(p => p.id === id);
    if (index === -1) return;

    const newPanes = panes.filter(p => p.id !== id);
    updatePanes(newPanes);

    // Update focus if removed pane was focused
    if (focusedId === id) {
      const newFocusIndex = Math.min(index, newPanes.length - 1);
      setFocusedId(newPanes[newFocusIndex]?.id ?? null);
    }
  }, [panes, focusedId, updatePanes]);

  // Close the focused pane
  const closeActive = useCallback(() => {
    if (focusedId) {
      remove(focusedId);
    }
  }, [focusedId, remove]);

  // Resize (lock) a pane
  const resize = useCallback((id: string, size: PaneSize) => {
    const newPanes = panes.map(p =>
      p.id === id ? { ...p, lockedSize: size } : p
    );
    updatePanes(newPanes);
  }, [panes, updatePanes]);

  // Unlock a pane (allow elastic expansion)
  const unlock = useCallback((id: string) => {
    const newPanes = panes.map(p =>
      p.id === id ? { ...p, lockedSize: 'AUTO' as PaneSize } : p
    );
    updatePanes(newPanes);
  }, [panes, updatePanes]);

  // Set focus
  const setFocus = useCallback((id: string | null) => {
    setFocusedId(id);
  }, []);

  // Navigate focus (vim-style: h=left, j=down, k=up, l=right)
  const moveFocus = useCallback((direction: 'h' | 'j' | 'k' | 'l') => {
    if (reflowedPanes.length === 0) return;

    const focusedPane = reflowedPanes.find(p => p.id === focusedId);
    if (!focusedPane) {
      // Focus first pane if none focused
      setFocusedId(reflowedPanes[0].id);
      return;
    }

    // Calculate center of focused pane
    const cx = focusedPane.x + focusedPane.cols / 2;
    const cy = focusedPane.y + focusedPane.rows / 2;

    // Find best candidate in direction
    let bestPane: GridPane | null = null;
    let bestScore = Infinity;

    for (const pane of reflowedPanes) {
      if (pane.id === focusedId || pane.cols === 0) continue;

      const px = pane.x + pane.cols / 2;
      const py = pane.y + pane.rows / 2;

      let isValid = false;
      let distance = 0;

      switch (direction) {
        case 'h': // Left
          isValid = px < cx;
          distance = Math.abs(px - cx) + Math.abs(py - cy) * 0.1;
          break;
        case 'l': // Right
          isValid = px > cx;
          distance = Math.abs(px - cx) + Math.abs(py - cy) * 0.1;
          break;
        case 'k': // Up
          isValid = py < cy;
          distance = Math.abs(py - cy) + Math.abs(px - cx) * 0.1;
          break;
        case 'j': // Down
          isValid = py > cy;
          distance = Math.abs(py - cy) + Math.abs(px - cx) * 0.1;
          break;
      }

      if (isValid && distance < bestScore) {
        bestScore = distance;
        bestPane = pane;
      }
    }

    if (bestPane) {
      setFocusedId(bestPane.id);
    }
  }, [reflowedPanes, focusedId]);

  // Switch workspace
  const switchWorkspace = useCallback((index: number) => {
    if (index >= 0 && index < workspaceCount) {
      setCurrentWorkspace(index);
      // Focus first pane in new workspace
      const newPanes = workspaces[index];
      setFocusedId(newPanes[0]?.id ?? null);
    }
  }, [workspaces, workspaceCount]);

  // Swap two panes (for drag reorder)
  const swapPanes = useCallback((idA: string, idB: string) => {
    const indexA = panes.findIndex(p => p.id === idA);
    const indexB = panes.findIndex(p => p.id === idB);
    if (indexA === -1 || indexB === -1) return;

    const newPanes = [...panes];
    [newPanes[indexA], newPanes[indexB]] = [newPanes[indexB], newPanes[indexA]];
    updatePanes(newPanes);
  }, [panes, updatePanes]);

  // Bring pane to front
  const bringToFront = useCallback((id: string) => {
    const index = panes.findIndex(p => p.id === id);
    if (index === -1) return;

    const pane = panes[index];
    const newPanes = [...panes.slice(0, index), ...panes.slice(index + 1), pane];
    updatePanes(newPanes);
    setFocusedId(id);
  }, [panes, updatePanes]);

  // Get pane by ID
  const getPane = useCallback((id: string) => {
    return panes.find(p => p.id === id);
  }, [panes]);

  // Check if pane type exists
  const hasPane = useCallback((type: GridPaneType) => {
    return panes.some(p => p.type === type);
  }, [panes]);

  // Find pane by type
  const findPane = useCallback((type: GridPaneType) => {
    return panes.find(p => p.type === type);
  }, [panes]);

  // Build state object
  const state: GridState = {
    panes,
    focusedId,
    workspace: currentWorkspace,
  };

  return {
    state,
    reflowedPanes,
    spawn,
    remove,
    closeActive,
    resize,
    unlock,
    setFocus,
    moveFocus,
    switchWorkspace,
    swapPanes,
    bringToFront,
    getPane,
    hasPane,
    findPane,
  };
}

export default useGridLayout;
