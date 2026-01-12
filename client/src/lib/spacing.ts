/**
 * Dynamic Spacing System
 *
 * This module provides constants and utilities for dynamic spacing
 * to prevent component overlaps and squashing across different viewport sizes.
 */

// Base spacing unit in pixels (matches Tailwind's default 4px base)
export const SPACING_BASE = 4;

// Spacing scale (multipliers of base unit)
export const SPACING_SCALE = {
  none: 0,
  xs: 1,      // 4px
  sm: 2,      // 8px
  md: 3,      // 12px
  lg: 4,      // 16px
  xl: 6,      // 24px
  '2xl': 8,   // 32px
  '3xl': 12,  // 48px
} as const;

export type SpacingKey = keyof typeof SPACING_SCALE;

// Breakpoints for responsive spacing (in pixels)
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 640,
  lg: 768,
  xl: 1024,
  '2xl': 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Component-specific minimum widths to prevent squashing
export const MIN_COMPONENT_WIDTHS = {
  tab: 80,
  tabWithClose: 120,
  fileTreeItem: 150,
  menuItem: 60,
  button: 32,
  iconButton: 24,
  statusBarSection: 80,
  sidebarPanel: 200,
  activityBar: 48,
} as const;

// Component-specific maximum widths
export const MAX_COMPONENT_WIDTHS = {
  tab: 200,
  fileTreeItem: 300,
  sidebarPanel: 400,
} as const;

// Minimum gaps between elements (in pixels)
export const MIN_GAPS = {
  inline: 4,
  compact: 8,
  normal: 12,
  relaxed: 16,
  spacious: 24,
} as const;

export type GapKey = keyof typeof MIN_GAPS;

/**
 * Get spacing value in pixels
 */
export function getSpacing(key: SpacingKey): number {
  return SPACING_SCALE[key] * SPACING_BASE;
}

/**
 * Get spacing value as CSS string
 */
export function getSpacingCss(key: SpacingKey): string {
  return `${getSpacing(key)}px`;
}

/**
 * Calculate dynamic spacing based on available width
 * Returns a spacing key appropriate for the given width
 */
export function getDynamicSpacing(
  availableWidth: number,
  baseSpacing: SpacingKey = 'md',
  options?: {
    minSpacing?: SpacingKey;
    maxSpacing?: SpacingKey;
  }
): SpacingKey {
  const { minSpacing = 'xs', maxSpacing = 'xl' } = options || {};

  const spacingKeys = Object.keys(SPACING_SCALE) as SpacingKey[];
  const baseIndex = spacingKeys.indexOf(baseSpacing);
  const minIndex = spacingKeys.indexOf(minSpacing);
  const maxIndex = spacingKeys.indexOf(maxSpacing);

  // Adjust spacing based on available width
  let adjustedIndex = baseIndex;

  if (availableWidth < BREAKPOINTS.sm) {
    adjustedIndex = Math.max(minIndex, baseIndex - 2);
  } else if (availableWidth < BREAKPOINTS.md) {
    adjustedIndex = Math.max(minIndex, baseIndex - 1);
  } else if (availableWidth >= BREAKPOINTS.xl) {
    adjustedIndex = Math.min(maxIndex, baseIndex + 1);
  }

  return spacingKeys[Math.max(minIndex, Math.min(maxIndex, adjustedIndex))];
}

/**
 * Calculate dynamic gap based on container width and element count
 */
export function getDynamicGap(
  containerWidth: number,
  elementCount: number,
  minElementWidth: number,
  options?: {
    preferredGap?: GapKey;
    minGap?: GapKey;
  }
): number {
  const { preferredGap = 'normal', minGap = 'inline' } = options || {};

  const preferredGapPx = MIN_GAPS[preferredGap];
  const minGapPx = MIN_GAPS[minGap];

  // Calculate available space for gaps
  const contentWidth = elementCount * minElementWidth;
  const totalGapSpace = containerWidth - contentWidth;
  const gapCount = Math.max(1, elementCount - 1);

  // Calculate optimal gap
  const calculatedGap = totalGapSpace / gapCount;

  return Math.max(minGapPx, Math.min(preferredGapPx, calculatedGap));
}

/**
 * Calculate how many items can fit in a container with proper spacing
 */
export function getVisibleItemCount(
  containerWidth: number,
  itemWidth: number,
  gap: number
): number {
  if (containerWidth <= 0 || itemWidth <= 0) return 0;

  // Normalize gap to avoid negative values; allow gaps larger than itemWidth for flexibility
  // but cap at itemWidth to prevent degenerate cases where gap exceeds item size
  const safeGap = Math.min(Math.max(0, gap), itemWidth);

  // First item doesn't need a leading gap
  const availableForItems = containerWidth + safeGap;
  const itemWithGap = itemWidth + safeGap;

  return Math.floor(availableForItems / itemWithGap);
}

/**
 * Calculate responsive indentation for nested items (e.g., file tree)
 */
export function getResponsiveIndent(
  level: number,
  containerWidth: number,
  options?: {
    baseIndent?: number;
    minIndent?: number;
    maxTotalIndent?: number;
  }
): number {
  const {
    baseIndent = 16,
    minIndent = 8,
    maxTotalIndent
  } = options || {};

  // Special case: level 0 should have no indent
  if (level === 0) return 0;

  // Calculate max total indent based on container width (leave at least 40% for content)
  const effectiveMaxIndent = maxTotalIndent ?? containerWidth * 0.4;

  // Calculate ideal total indent
  const idealTotalIndent = level * baseIndent;

  // If we exceed max, reduce indent per level
  if (idealTotalIndent > effectiveMaxIndent) {
    const adjustedIndent = Math.max(minIndent, effectiveMaxIndent / level);
    return adjustedIndent * level;
  }

  return idealTotalIndent;
}

/**
 * Determine if elements should collapse (e.g., show overflow menu)
 */
export function shouldCollapse(
  containerWidth: number,
  elementCount: number,
  minElementWidth: number,
  minGap: number = MIN_GAPS.inline
): boolean {
  const requiredWidth = elementCount * minElementWidth + (elementCount - 1) * minGap;
  return requiredWidth > containerWidth;
}

/**
 * Calculate flexible element width based on container
 */
export function getFlexibleWidth(
  containerWidth: number,
  elementCount: number,
  minWidth: number,
  maxWidth: number,
  gap: number
): number {
  if (elementCount <= 0) return minWidth;

  const totalGapSpace = (elementCount - 1) * gap;
  const availableForElements = containerWidth - totalGapSpace;
  const calculatedWidth = availableForElements / elementCount;

  return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
}

/**
 * CSS class helper for responsive spacing
 */
export function getSpacingClasses(
  direction: 'horizontal' | 'vertical' | 'both',
  size: SpacingKey
): string {
  const sizeMap: Record<SpacingKey, string> = {
    none: '0',
    xs: '1',
    sm: '2',
    md: '3',
    lg: '4',
    xl: '6',
    '2xl': '8',
    '3xl': '12',
  };

  const tailwindSize = sizeMap[size];

  switch (direction) {
    case 'horizontal':
      return `px-${tailwindSize}`;
    case 'vertical':
      return `py-${tailwindSize}`;
    case 'both':
      return `p-${tailwindSize}`;
  }
}

/**
 * CSS class helper for responsive gaps
 */
export function getGapClass(size: GapKey): string {
  const gapMap: Record<GapKey, string> = {
    inline: 'gap-1',
    compact: 'gap-2',
    normal: 'gap-3',
    relaxed: 'gap-4',
    spacious: 'gap-6',
  };

  return gapMap[size];
}

// ============================================================================
// Auto-Fill Spacing System
// ============================================================================

/**
 * Space fill variants for different container types
 */
export type SpaceFillVariant =
  | 'panel'      // Side panels (file explorer, extensions, etc.)
  | 'content'    // Main content areas
  | 'toolbar'    // Toolbars and action bars
  | 'card'       // Card-like containers
  | 'dialog'     // Dialogs and modals
  | 'list'       // List containers
  | 'form'       // Form containers
  | 'none';      // No automatic spacing

/**
 * Configuration for auto-fill spacing behavior
 */
export interface SpaceFillConfig {
  /** Base padding for the variant */
  basePadding: SpacingKey;
  /** Minimum padding to maintain */
  minPadding: SpacingKey;
  /** Maximum padding allowed */
  maxPadding: SpacingKey;
  /** Gap between child elements */
  gap: GapKey;
  /** Whether to fill available height */
  fillHeight: boolean;
  /** Whether to fill available width */
  fillWidth: boolean;
  /** Whether content should scroll */
  scrollable: boolean;
  /** Overflow behavior */
  overflow: 'auto' | 'hidden' | 'visible' | 'scroll';
}

/**
 * Default configurations for each space fill variant
 */
export const SPACE_FILL_CONFIGS: Record<SpaceFillVariant, SpaceFillConfig> = {
  panel: {
    basePadding: 'md',
    minPadding: 'sm',
    maxPadding: 'lg',
    gap: 'compact',
    fillHeight: true,
    fillWidth: true,
    scrollable: true,
    overflow: 'auto',
  },
  content: {
    basePadding: 'lg',
    minPadding: 'md',
    maxPadding: 'xl',
    gap: 'normal',
    fillHeight: true,
    fillWidth: true,
    scrollable: true,
    overflow: 'auto',
  },
  toolbar: {
    basePadding: 'sm',
    minPadding: 'xs',
    maxPadding: 'md',
    gap: 'compact',
    fillHeight: false,
    fillWidth: true,
    scrollable: false,
    overflow: 'hidden',
  },
  card: {
    basePadding: 'md',
    minPadding: 'sm',
    maxPadding: 'lg',
    gap: 'normal',
    fillHeight: false,
    fillWidth: false,
    scrollable: false,
    overflow: 'hidden',
  },
  dialog: {
    basePadding: 'lg',
    minPadding: 'md',
    maxPadding: 'xl',
    gap: 'relaxed',
    fillHeight: false,
    fillWidth: false,
    scrollable: true,
    overflow: 'auto',
  },
  list: {
    basePadding: 'sm',
    minPadding: 'xs',
    maxPadding: 'md',
    gap: 'inline',
    fillHeight: true,
    fillWidth: true,
    scrollable: true,
    overflow: 'auto',
  },
  form: {
    basePadding: 'md',
    minPadding: 'sm',
    maxPadding: 'lg',
    gap: 'normal',
    fillHeight: false,
    fillWidth: true,
    scrollable: false,
    overflow: 'visible',
  },
  none: {
    basePadding: 'none',
    minPadding: 'none',
    maxPadding: 'none',
    gap: 'inline',
    fillHeight: false,
    fillWidth: false,
    scrollable: false,
    overflow: 'visible',
  },
};

/**
 * Calculate auto-fill spacing based on container dimensions and variant
 */
export function getAutoFillSpacing(
  containerWidth: number,
  containerHeight: number,
  variant: SpaceFillVariant = 'panel'
): {
  padding: number;
  paddingClass: string;
  gap: number;
  gapClass: string;
  shouldScroll: boolean;
} {
  const config = SPACE_FILL_CONFIGS[variant];

  // Get responsive padding based on container size
  const responsivePadding = getDynamicSpacing(
    Math.min(containerWidth, containerHeight),
    config.basePadding,
    { minSpacing: config.minPadding, maxSpacing: config.maxPadding }
  );

  const padding = getSpacing(responsivePadding);
  const paddingClass = getSpacingClasses('both', responsivePadding);
  const gap = MIN_GAPS[config.gap];
  const gapClass = getGapClass(config.gap);

  // Determine if scrolling is needed based on available space
  const shouldScroll = config.scrollable;

  return {
    padding,
    paddingClass,
    gap,
    gapClass,
    shouldScroll,
  };
}

/**
 * Generate CSS classes for a space fill container
 */
export function getSpaceFillClasses(
  variant: SpaceFillVariant,
  options?: {
    containerWidth?: number;
    containerHeight?: number;
    direction?: 'row' | 'column';
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  }
): string {
  const config = SPACE_FILL_CONFIGS[variant];
  const {
    containerWidth = 0,
    containerHeight = 0,
    direction = 'column',
    align = 'stretch',
    justify = 'start',
  } = options || {};

  const classes: string[] = ['flex', 'min-w-0', 'min-h-0'];

  // Direction
  classes.push(direction === 'row' ? 'flex-row' : 'flex-col');

  // Alignment
  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  classes.push(alignMap[align]);

  // Justification
  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };
  classes.push(justifyMap[justify]);

  // Fill behavior
  if (config.fillWidth) {
    classes.push('w-full');
  }
  if (config.fillHeight) {
    classes.push('h-full', 'flex-1');
  }

  // Overflow
  const overflowMap = {
    auto: 'overflow-auto',
    hidden: 'overflow-hidden',
    visible: 'overflow-visible',
    scroll: 'overflow-scroll',
  };
  classes.push(overflowMap[config.overflow]);

  // Dynamic spacing based on container size
  if (containerWidth > 0 || containerHeight > 0) {
    const { paddingClass, gapClass } = getAutoFillSpacing(
      containerWidth,
      containerHeight,
      variant
    );
    classes.push(paddingClass, gapClass);
  } else {
    // Use base spacing when dimensions unknown
    classes.push(
      getSpacingClasses('both', config.basePadding),
      getGapClass(config.gap)
    );
  }

  return classes.join(' ');
}

/**
 * Generate inline styles for dynamic spacing that can't be expressed with Tailwind classes
 */
export function getSpaceFillStyles(
  containerWidth: number,
  containerHeight: number,
  variant: SpaceFillVariant = 'panel'
): React.CSSProperties {
  const { padding, gap } = getAutoFillSpacing(containerWidth, containerHeight, variant);

  return {
    padding: `${padding}px`,
    gap: `${gap}px`,
  };
}
