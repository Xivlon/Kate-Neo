import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BREAKPOINTS,
  MIN_COMPONENT_WIDTHS,
  MIN_GAPS,
  getDynamicSpacing,
  getDynamicGap,
  getResponsiveIndent,
  shouldCollapse,
  getFlexibleWidth,
  getVisibleItemCount,
  SPACE_FILL_CONFIGS,
  getAutoFillSpacing,
  getSpaceFillClasses,
  getSpaceFillStyles,
  type SpacingKey,
  type GapKey,
  type BreakpointKey,
} from '@/lib/spacing';

export interface ContainerDimensions {
  width: number;
  height: number;
}

export interface ResponsiveSpacingOptions {
  /** Debounce delay for resize observations (ms) */
  debounceDelay?: number;
  /** Minimum width before considering overflow */
  minWidth?: number;
  /** Enable height tracking */
  trackHeight?: boolean;
}

export interface ResponsiveSpacingResult {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Current container dimensions */
  dimensions: ContainerDimensions;
  /** Current breakpoint based on container width */
  breakpoint: BreakpointKey;
  /** Whether the container is considered compact */
  isCompact: boolean;
  /** Whether the container is considered narrow */
  isNarrow: boolean;
  /** Get dynamic spacing based on current container size */
  getSpacing: (baseSpacing?: SpacingKey) => SpacingKey;
  /** Get dynamic gap for elements */
  getGap: (elementCount: number, minElementWidth: number, preferredGap?: GapKey) => number;
  /** Get responsive indentation for nested items */
  getIndent: (level: number, baseIndent?: number) => number;
  /** Check if elements should collapse into an overflow menu */
  shouldCollapse: (elementCount: number, minElementWidth: number) => boolean;
  /** Calculate flexible width for elements */
  getFlexWidth: (elementCount: number, minWidth: number, maxWidth: number, gap: number) => number;
  /** Get number of items that can be visible */
  getVisibleCount: (itemWidth: number, gap: number) => number;
}

/**
 * Hook for responsive spacing calculations based on container dimensions
 */
export function useResponsiveSpacing(
  options: ResponsiveSpacingOptions = {}
): ResponsiveSpacingResult {
  const { debounceDelay = 100, minWidth = 200, trackHeight = false } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [dimensions, setDimensions] = useState<ContainerDimensions>({
    width: 0,
    height: 0,
  });

  // Debounced resize handler
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleResize = useCallback(
    (entries: ResizeObserverEntry[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          setDimensions((prev) => {
            // Only update if values changed
            if (prev.width !== width || (trackHeight && prev.height !== height)) {
              return { width, height: trackHeight ? height : prev.height };
            }
            return prev;
          });
        }
      }, debounceDelay);
    },
    [debounceDelay, trackHeight]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Get initial dimensions
    const rect = element.getBoundingClientRect();
    setDimensions({
      width: rect.width,
      height: trackHeight ? rect.height : 0,
    });

    // Set up ResizeObserver
    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleResize, trackHeight]);

  // Calculate current breakpoint
  const breakpoint = useMemo((): BreakpointKey => {
    const { width } = dimensions;
    if (width < BREAKPOINTS.xs) return 'xs';
    if (width < BREAKPOINTS.sm) return 'sm';
    if (width < BREAKPOINTS.md) return 'md';
    if (width < BREAKPOINTS.lg) return 'lg';
    if (width < BREAKPOINTS.xl) return 'xl';
    return '2xl';
  }, [dimensions]);

  // Derived state
  const isCompact = dimensions.width < BREAKPOINTS.md;
  const isNarrow = dimensions.width < minWidth;

  // Memoized utility functions
  const getSpacing = useCallback(
    (baseSpacing: SpacingKey = 'md'): SpacingKey => {
      return getDynamicSpacing(dimensions.width, baseSpacing);
    },
    [dimensions.width]
  );

  const getGap = useCallback(
    (elementCount: number, minElementWidth: number, preferredGap: GapKey = 'normal'): number => {
      return getDynamicGap(dimensions.width, elementCount, minElementWidth, {
        preferredGap,
      });
    },
    [dimensions.width]
  );

  const getIndent = useCallback(
    (level: number, baseIndent: number = 16): number => {
      return getResponsiveIndent(level, dimensions.width, { baseIndent });
    },
    [dimensions.width]
  );

  const checkShouldCollapse = useCallback(
    (elementCount: number, minElementWidth: number): boolean => {
      return shouldCollapse(dimensions.width, elementCount, minElementWidth, MIN_GAPS.inline);
    },
    [dimensions.width]
  );

  const getFlexWidth = useCallback(
    (elementCount: number, minWidth: number, maxWidth: number, gap: number): number => {
      return getFlexibleWidth(dimensions.width, elementCount, minWidth, maxWidth, gap);
    },
    [dimensions.width]
  );

  const getVisibleCount = useCallback(
    (itemWidth: number, gap: number): number => {
      return getVisibleItemCount(dimensions.width, itemWidth, gap);
    },
    [dimensions.width]
  );

  return {
    containerRef,
    dimensions,
    breakpoint,
    isCompact,
    isNarrow,
    getSpacing,
    getGap,
    getIndent,
    shouldCollapse: checkShouldCollapse,
    getFlexWidth,
    getVisibleCount,
  };
}

/**
 * Hook for tracking overflow state in a scrollable container
 */
export function useOverflowDetection(
  containerRef: React.RefObject<HTMLElement | null>,
  options: { direction?: 'horizontal' | 'vertical' | 'both'; debounceDelay?: number } = {}
) {
  const { direction = 'horizontal', debounceDelay = 100 } = options;

  const [overflow, setOverflow] = useState({
    hasOverflow: false,
    scrollPosition: 0,
    canScrollStart: false,
    canScrollEnd: false,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkOverflow = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    const isHorizontal = direction === 'horizontal' || direction === 'both';
    const isVertical = direction === 'vertical' || direction === 'both';

    const hasHorizontalOverflow = isHorizontal && element.scrollWidth > element.clientWidth;
    const hasVerticalOverflow = isVertical && element.scrollHeight > element.clientHeight;
    const hasOverflow = hasHorizontalOverflow || hasVerticalOverflow;

    const scrollPosition = isHorizontal ? element.scrollLeft : element.scrollTop;
    const maxScroll = isHorizontal
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight;

    setOverflow({
      hasOverflow,
      scrollPosition,
      canScrollStart: scrollPosition > 0,
      canScrollEnd: scrollPosition < maxScroll - 1,
    });
  }, [containerRef, direction]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const debouncedCheck = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(checkOverflow, debounceDelay);
    };

    // Initial check
    checkOverflow();

    // Listen for scroll events
    element.addEventListener('scroll', debouncedCheck, { passive: true });

    // Set up ResizeObserver for size changes
    const observer = new ResizeObserver(debouncedCheck);
    observer.observe(element);

    // Observe children for content changes that affect overflow
    // Only observing childList to minimize performance impact
    const mutationObserver = new MutationObserver(debouncedCheck);
    mutationObserver.observe(element, {
      childList: true,
    });

    return () => {
      element.removeEventListener('scroll', debouncedCheck);
      observer.disconnect();
      mutationObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, checkOverflow, debounceDelay]);

  const scrollTo = useCallback(
    (position: 'start' | 'end' | number) => {
      const element = containerRef.current;
      if (!element) return;

      const isHorizontal = direction === 'horizontal';
      const maxScroll = isHorizontal
        ? element.scrollWidth - element.clientWidth
        : element.scrollHeight - element.clientHeight;

      let targetPosition: number;
      if (position === 'start') {
        targetPosition = 0;
      } else if (position === 'end') {
        targetPosition = maxScroll;
      } else {
        targetPosition = position;
      }

      element.scrollTo({
        [isHorizontal ? 'left' : 'top']: targetPosition,
        behavior: 'smooth',
      });
    },
    [containerRef, direction]
  );

  return {
    ...overflow,
    scrollTo,
    checkOverflow,
  };
}

/**
 * Hook for element-level responsive behavior
 */
export function useElementResponsive<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateRect = () => {
      setRect(element.getBoundingClientRect());
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return {
    elementRef,
    rect,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  };
}

/**
 * Hook for automatic space filling with dynamic spacing
 * This is a convenience hook for components that want to use the SpaceFill system
 * without using the SpaceFill component wrapper.
 */
export function useSpaceFill(
  variant: import('@/lib/spacing').SpaceFillVariant = 'panel',
  options: {
    debounceDelay?: number;
    direction?: 'row' | 'column';
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  } = {}
) {
  const {
    debounceDelay = 50,
    direction = 'column',
    align = 'stretch',
    justify = 'start',
  } = options;

  const { containerRef, dimensions } = useResponsiveSpacing({
    debounceDelay,
    trackHeight: true,
  });

  const config = SPACE_FILL_CONFIGS[variant];
  const hasDimensions = dimensions.width > 0 && dimensions.height > 0;

  // Get computed spacing values
  const spacing = hasDimensions
    ? getAutoFillSpacing(dimensions.width, dimensions.height, variant)
    : {
        padding: 0,
        paddingClass: '',
        gap: 0,
        gapClass: '',
        shouldScroll: config.scrollable,
      };

  // Get computed class names
  const className = getSpaceFillClasses(variant, {
    containerWidth: hasDimensions ? dimensions.width : undefined,
    containerHeight: hasDimensions ? dimensions.height : undefined,
    direction,
    align,
    justify,
  });

  // Get computed inline styles (for precise dynamic values)
  const style = hasDimensions
    ? getSpaceFillStyles(dimensions.width, dimensions.height, variant)
    : {};

  return {
    /** Ref to attach to the container element */
    containerRef,
    /** Current container dimensions */
    dimensions,
    /** Whether dimensions are available */
    hasDimensions,
    /** Computed spacing values */
    spacing,
    /** Pre-computed CSS classes for the container */
    className,
    /** Pre-computed inline styles for precise spacing */
    style,
    /** The variant configuration being used */
    config,
    /** Whether the container should be scrollable */
    shouldScroll: config.scrollable,
  };
}

export { MIN_COMPONENT_WIDTHS, MIN_GAPS, BREAKPOINTS };
