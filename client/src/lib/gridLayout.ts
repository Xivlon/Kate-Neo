/**
 * Grid Layout System - Crystal Engine
 *
 * A 4x4 grid-based layout system inspired by tiling window managers.
 * Features elastic expansion and automatic gap-filling (Crystal Reflow).
 */

// === GRID CONSTANTS ===

/** Grid dimensions */
export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const GRID_GAP = 8; // px

/** Pane size presets */
export type PaneSize = 'MINI' | 'STD' | 'WIDE' | 'TALL' | 'AUTO';

export const SIZE_MAP: Record<Exclude<PaneSize, 'AUTO'>, { cols: number; rows: number }> = {
  MINI: { cols: 1, rows: 1 },
  STD: { cols: 2, rows: 1 },
  WIDE: { cols: 4, rows: 1 },
  TALL: { cols: 2, rows: 2 },
};

/** Pane types that can be rendered in the grid */
export type GridPaneType =
  | 'EDITOR'
  | 'FILE_TREE'
  | 'TERMINAL'
  | 'SETTINGS'
  | 'AI_ASSISTANT'
  | 'SOURCE_CONTROL'
  | 'DEBUG'
  | 'EXTENSIONS'
  | 'PREVIEW';

/** Configuration for each pane type */
export interface PaneConfig {
  /** Preferred size when spawning */
  preferred: PaneSize;
  /** Valid sizes this pane type can use */
  valid: PaneSize[];
  /** Display name */
  label: string;
  /** Icon name (lucide) */
  icon: string;
}

export const PANE_CONFIGS: Record<GridPaneType, PaneConfig> = {
  EDITOR: {
    preferred: 'TALL',
    valid: ['TALL', 'WIDE', 'STD'],
    label: 'Editor',
    icon: 'Code'
  },
  FILE_TREE: {
    preferred: 'STD',
    valid: ['STD', 'TALL', 'MINI'],
    label: 'Files',
    icon: 'Files'
  },
  TERMINAL: {
    preferred: 'WIDE',
    valid: ['WIDE', 'STD', 'TALL'],
    label: 'Terminal',
    icon: 'Terminal'
  },
  SETTINGS: {
    preferred: 'TALL',
    valid: ['TALL', 'STD'],
    label: 'Settings',
    icon: 'Settings'
  },
  AI_ASSISTANT: {
    preferred: 'STD',
    valid: ['STD', 'TALL', 'MINI'],
    label: 'AI Assistant',
    icon: 'Sparkles'
  },
  SOURCE_CONTROL: {
    preferred: 'STD',
    valid: ['STD', 'TALL', 'MINI'],
    label: 'Source Control',
    icon: 'GitBranch'
  },
  DEBUG: {
    preferred: 'STD',
    valid: ['STD', 'TALL'],
    label: 'Debug',
    icon: 'Bug'
  },
  EXTENSIONS: {
    preferred: 'STD',
    valid: ['STD', 'TALL', 'MINI'],
    label: 'Extensions',
    icon: 'Package'
  },
  PREVIEW: {
    preferred: 'TALL',
    valid: ['TALL', 'STD', 'WIDE'],
    label: 'Preview',
    icon: 'Eye'
  },
};

// === PANE STATE ===

export interface GridPane {
  /** Unique identifier */
  id: string;
  /** Type of pane */
  type: GridPaneType;
  /** Grid position (0-3) */
  x: number;
  /** Grid position (0-3) */
  y: number;
  /** Width in grid cells */
  cols: number;
  /** Height in grid cells */
  rows: number;
  /** Locked size (prevents elastic expansion) */
  lockedSize?: PaneSize;
  /** Additional data for the pane */
  data?: Record<string, unknown>;
}

export interface GridState {
  /** All panes in current workspace */
  panes: GridPane[];
  /** Currently focused pane ID */
  focusedId: string | null;
  /** Current workspace index (0-8) */
  workspace: number;
}

// === OCCUPANCY MAP ===

export type OccupancyMap = boolean[][];

export function createOccupancyMap(): OccupancyMap {
  return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false));
}

export function canFit(
  map: OccupancyMap,
  x: number,
  y: number,
  cols: number,
  rows: number
): boolean {
  if (x + cols > GRID_COLS || y + rows > GRID_ROWS) return false;
  if (x < 0 || y < 0) return false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (map[y + row][x + col]) return false;
    }
  }
  return true;
}

export function markMap(
  map: OccupancyMap,
  x: number,
  y: number,
  cols: number,
  rows: number,
  occupied: boolean
): void {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (y + row < GRID_ROWS && x + col < GRID_COLS) {
        map[y + row][x + col] = occupied;
      }
    }
  }
}

// === CRYSTAL REFLOW ALGORITHM ===

/**
 * Crystal Reflow Algorithm
 *
 * Phase 1: Place panes using gravity (top-left priority)
 * Phase 2: Elastic expansion for unlocked panes
 */
export function crystalReflow(panes: GridPane[]): GridPane[] {
  if (panes.length === 0) return [];

  // Create fresh pane copies without position data
  const reflowedPanes: GridPane[] = panes.map(p => ({
    ...p,
    x: -1,
    y: -1,
    cols: 0,
    rows: 0,
  }));

  const map = createOccupancyMap();

  // PHASE 1: PLACEMENT (Gravity with Lock Priority)
  for (const pane of reflowedPanes) {
    const config = PANE_CONFIGS[pane.type];

    // Determine size attempts: locked size first, then preferred, then valid
    let attempts: PaneSize[] = [];
    if (pane.lockedSize && pane.lockedSize !== 'AUTO' && SIZE_MAP[pane.lockedSize]) {
      attempts = [pane.lockedSize];
    } else {
      attempts = [config.preferred, ...config.valid].filter(s => s !== 'AUTO') as Exclude<PaneSize, 'AUTO'>[];
    }

    // Remove duplicates
    const uniqueAttempts = [...new Set(attempts)] as Exclude<PaneSize, 'AUTO'>[];

    let placed = false;

    // Try each size, scanning from top-left
    searchLoop:
    for (const sizeKey of uniqueAttempts) {
      const size = SIZE_MAP[sizeKey];
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          if (canFit(map, x, y, size.cols, size.rows)) {
            markMap(map, x, y, size.cols, size.rows, true);
            pane.x = x;
            pane.y = y;
            pane.cols = size.cols;
            pane.rows = size.rows;
            placed = true;
            break searchLoop;
          }
        }
      }
    }

    // If couldn't place, mark as hidden (0 size)
    if (!placed) {
      pane.x = 0;
      pane.y = 0;
      pane.cols = 0;
      pane.rows = 0;
    }
  }

  // PHASE 2: ELASTIC EXPANSION (Only for Unlocked Panes)
  let growth = true;
  let iterations = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (growth && iterations < maxIterations) {
    growth = false;
    iterations++;

    for (const pane of reflowedPanes) {
      // Skip hidden or locked panes
      if (pane.cols === 0) continue;
      if (pane.lockedSize && pane.lockedSize !== 'AUTO') continue;

      // Try grow right
      if (pane.x + pane.cols < GRID_COLS) {
        if (canFit(map, pane.x + pane.cols, pane.y, 1, pane.rows)) {
          markMap(map, pane.x + pane.cols, pane.y, 1, pane.rows, true);
          pane.cols++;
          growth = true;
        }
      }

      // Try grow down
      if (pane.y + pane.rows < GRID_ROWS) {
        if (canFit(map, pane.x, pane.y + pane.rows, pane.cols, 1)) {
          markMap(map, pane.x, pane.y + pane.rows, pane.cols, 1, true);
          pane.rows++;
          growth = true;
        }
      }
    }
  }

  return reflowedPanes;
}

// === UTILITY FUNCTIONS ===

let paneIdCounter = 0;

export function generatePaneId(): string {
  return `pane-${Date.now()}-${++paneIdCounter}`;
}

export function createPane(type: GridPaneType, data?: Record<string, unknown>): GridPane {
  return {
    id: generatePaneId(),
    type,
    x: -1,
    y: -1,
    cols: 0,
    rows: 0,
    data,
  };
}

export function getSizeLabel(pane: GridPane): string {
  if (pane.lockedSize) {
    return pane.lockedSize === 'AUTO' ? '' : `[L:${pane.lockedSize}]`;
  }
  return '';
}

/**
 * Find a pane at grid coordinates
 */
export function findPaneAt(panes: GridPane[], x: number, y: number): GridPane | undefined {
  return panes.find(p =>
    x >= p.x && x < p.x + p.cols &&
    y >= p.y && y < p.y + p.rows
  );
}

/**
 * Get CSS grid styles for a pane
 */
export function getPaneGridStyles(pane: GridPane): React.CSSProperties {
  if (pane.cols === 0 || pane.rows === 0) {
    return { display: 'none' };
  }

  return {
    gridColumnStart: pane.x + 1,
    gridColumnEnd: `span ${pane.cols}`,
    gridRowStart: pane.y + 1,
    gridRowEnd: `span ${pane.rows}`,
  };
}

/**
 * Get CSS grid container styles
 */
export function getGridContainerStyles(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
    gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
    gap: `${GRID_GAP}px`,
    padding: `${GRID_GAP}px`,
    height: '100%',
    width: '100%',
  };
}
