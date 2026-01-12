import React, { forwardRef } from 'react';
import { useResponsiveSpacing } from '@/hooks/useResponsiveSpacing';
import {
  type SpaceFillVariant,
  SPACE_FILL_CONFIGS,
  getAutoFillSpacing,
  getSpaceFillClasses,
} from '@/lib/spacing';
import { cn } from '@/lib/utils';

export interface SpaceFillProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The spacing variant to use. Each variant has pre-configured spacing behavior.
   * - panel: Side panels (file explorer, extensions, etc.)
   * - content: Main content areas
   * - toolbar: Toolbars and action bars
   * - card: Card-like containers
   * - dialog: Dialogs and modals
   * - list: List containers
   * - form: Form containers
   * - none: No automatic spacing
   */
  variant?: SpaceFillVariant;

  /**
   * Flex direction for child elements
   */
  direction?: 'row' | 'column';

  /**
   * Alignment of child elements (cross-axis)
   */
  align?: 'start' | 'center' | 'end' | 'stretch';

  /**
   * Justification of child elements (main-axis)
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';

  /**
   * Whether to use dynamic spacing based on container size.
   * When true, spacing adapts to available space.
   */
  dynamic?: boolean;

  /**
   * Custom padding override (Tailwind class or CSS value)
   */
  padding?: string;

  /**
   * Custom gap override (Tailwind class or CSS value)
   */
  gap?: string;

  /**
   * HTML element to render as
   */
  as?: keyof JSX.IntrinsicElements;

  /**
   * Children elements
   */
  children?: React.ReactNode;
}

/**
 * SpaceFill - A container component that automatically handles whitespace filling
 * and spacing for non-canvas components.
 *
 * This component reduces the need for individual padding/margin code in each component,
 * providing consistent spacing behavior based on the variant type and container size.
 *
 * @example
 * // Basic panel with automatic spacing
 * <SpaceFill variant="panel">
 *   <FileTree />
 * </SpaceFill>
 *
 * @example
 * // Toolbar with horizontal layout
 * <SpaceFill variant="toolbar" direction="row" align="center">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </SpaceFill>
 *
 * @example
 * // Dynamic spacing that adapts to container size
 * <SpaceFill variant="content" dynamic>
 *   <MainContent />
 * </SpaceFill>
 */
export const SpaceFill = forwardRef<HTMLDivElement, SpaceFillProps>(
  (
    {
      variant = 'panel',
      direction = 'column',
      align = 'stretch',
      justify = 'start',
      dynamic = true,
      padding,
      gap,
      as: Component = 'div',
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    // Use responsive spacing hook for dynamic sizing
    const {
      containerRef,
      dimensions,
    } = useResponsiveSpacing({
      debounceDelay: 50,
      trackHeight: true,
    });

    // Get configuration for the variant
    const config = SPACE_FILL_CONFIGS[variant];

    // Calculate dynamic spacing if enabled and dimensions are available
    const hasDimensions = dynamic && dimensions.width > 0 && dimensions.height > 0;
    const dynamicSpacing = hasDimensions
      ? getAutoFillSpacing(dimensions.width, dimensions.height, variant)
      : null;

    // Build base classes
    const baseClasses = getSpaceFillClasses(variant, {
      containerWidth: hasDimensions ? dimensions.width : undefined,
      containerHeight: hasDimensions ? dimensions.height : undefined,
      direction,
      align,
      justify,
    });

    // Override padding/gap if custom values provided
    const overrideClasses: string[] = [];
    if (padding) {
      // Remove default padding classes if custom padding provided
      overrideClasses.push(padding);
    }
    if (gap) {
      // Remove default gap classes if custom gap provided
      overrideClasses.push(gap);
    }

    // Build final className, filtering out padding/gap classes if overridden
    let finalBaseClasses = baseClasses;
    if (padding) {
      finalBaseClasses = finalBaseClasses.replace(/p-\d+|px-\d+|py-\d+/g, '').trim();
    }
    if (gap) {
      finalBaseClasses = finalBaseClasses.replace(/gap-\d+/g, '').trim();
    }

    // Combine refs
    const combinedRef = (node: HTMLDivElement | null) => {
      // Update internal ref
      (containerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      // Forward external ref
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Build inline styles for dynamic spacing (when needed)
    const dynamicStyles: React.CSSProperties = {};
    if (hasDimensions && dynamicSpacing && !padding) {
      dynamicStyles.padding = `${dynamicSpacing.padding}px`;
    }
    if (hasDimensions && dynamicSpacing && !gap) {
      dynamicStyles.gap = `${dynamicSpacing.gap}px`;
    }

    const ElementComponent = Component as React.ElementType;

    return (
      <ElementComponent
        ref={combinedRef}
        className={cn(finalBaseClasses, ...overrideClasses, className)}
        style={{ ...dynamicStyles, ...style }}
        data-space-fill={variant}
        {...props}
      >
        {children}
      </ElementComponent>
    );
  }
);

SpaceFill.displayName = 'SpaceFill';

/**
 * Preset SpaceFill components for common use cases
 */

/**
 * Panel container with scrollable content
 */
export const PanelFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant'>>(
  (props, ref) => <SpaceFill ref={ref} variant="panel" {...props} />
);
PanelFill.displayName = 'PanelFill';

/**
 * Main content area with generous spacing
 */
export const ContentFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant'>>(
  (props, ref) => <SpaceFill ref={ref} variant="content" {...props} />
);
ContentFill.displayName = 'ContentFill';

/**
 * Toolbar container with compact horizontal layout
 */
export const ToolbarFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant' | 'direction'>>(
  (props, ref) => <SpaceFill ref={ref} variant="toolbar" direction="row" align="center" {...props} />
);
ToolbarFill.displayName = 'ToolbarFill';

/**
 * Card container with contained spacing
 */
export const CardFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant'>>(
  (props, ref) => <SpaceFill ref={ref} variant="card" {...props} />
);
CardFill.displayName = 'CardFill';

/**
 * List container with minimal spacing between items
 */
export const ListFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant'>>(
  (props, ref) => <SpaceFill ref={ref} variant="list" {...props} />
);
ListFill.displayName = 'ListFill';

/**
 * Form container with appropriate field spacing
 */
export const FormFill = forwardRef<HTMLDivElement, Omit<SpaceFillProps, 'variant'>>(
  (props, ref) => <SpaceFill ref={ref} variant="form" {...props} />
);
FormFill.displayName = 'FormFill';

export default SpaceFill;
