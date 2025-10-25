/**
 * Virtualized Tree Component
 * 
 * Efficient tree rendering for large datasets using viewport-based rendering.
 * Only renders visible items to improve performance.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface VirtualizedTreeNode {
  id: string;
  label: string;
  children?: VirtualizedTreeNode[];
  expanded?: boolean;
  data?: any;
}

export interface VirtualizedTreeProps {
  /** Tree nodes */
  nodes: VirtualizedTreeNode[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Container height in pixels */
  height: number;
  /** Overscan count for smooth scrolling */
  overscan?: number;
  /** Render function for tree items */
  renderItem: (node: VirtualizedTreeNode, depth: number) => React.ReactNode;
  /** On item click */
  onItemClick?: (node: VirtualizedTreeNode) => void;
  /** On item double click */
  onItemDoubleClick?: (node: VirtualizedTreeNode) => void;
  /** On expand/collapse */
  onToggle?: (node: VirtualizedTreeNode, expanded: boolean) => void;
  /** Class name for container */
  className?: string;
}

interface FlattenedNode extends VirtualizedTreeNode {
  depth: number;
  index: number;
}

/**
 * Flatten tree structure for virtualization
 */
function flattenTree(
  nodes: VirtualizedTreeNode[],
  depth: number = 0,
  result: FlattenedNode[] = []
): FlattenedNode[] {
  for (const node of nodes) {
    result.push({ ...node, depth, index: result.length });
    
    if (node.expanded && node.children) {
      flattenTree(node.children, depth + 1, result);
    }
  }
  
  return result;
}

/**
 * Virtualized Tree Component
 */
export function VirtualizedTree({
  nodes,
  itemHeight,
  height,
  overscan = 5,
  renderItem,
  onItemClick,
  onItemDoubleClick,
  onToggle,
  className = '',
}: VirtualizedTreeProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten tree for rendering
  const flatItems = React.useMemo(() => flattenTree(nodes), [nodes]);
  const totalHeight = flatItems.length * itemHeight;

  // Calculate visible range
  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      flatItems.length,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, height, overscan, flatItems.length]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Render visible items
  const visibleItems = React.useMemo(() => {
    const items = [];
    
    for (let i = visibleRange.startIndex; i < visibleRange.endIndex; i++) {
      const node = flatItems[i];
      const offsetTop = i * itemHeight;
      
      items.push(
        <div
          key={node.id}
          style={{
            position: 'absolute',
            top: offsetTop,
            left: 0,
            right: 0,
            height: itemHeight,
            paddingLeft: node.depth * 16,
          }}
          onClick={() => onItemClick?.(node)}
          onDoubleClick={() => onItemDoubleClick?.(node)}
        >
          {renderItem(node, node.depth)}
        </div>
      );
    }
    
    return items;
  }, [visibleRange, flatItems, itemHeight, renderItem, onItemClick, onItemDoubleClick]);

  return (
    <div
      ref={containerRef}
      className={`virtualized-tree ${className}`}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * Virtualized List Component
 * Simpler component for flat lists
 */
export interface VirtualizedListProps<T> {
  /** List items */
  items: T[];
  /** Height of each item in pixels */
  itemHeight: number;
  /** Container height in pixels */
  height: number;
  /** Overscan count */
  overscan?: number;
  /** Render function */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Item key extractor */
  getItemKey: (item: T, index: number) => string | number;
  /** On item click */
  onItemClick?: (item: T, index: number) => void;
  /** Class name */
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  overscan = 5,
  renderItem,
  getItemKey,
  onItemClick,
  className = '',
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, height, overscan, items.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = React.useMemo(() => {
    const rendered = [];
    
    for (let i = visibleRange.startIndex; i < visibleRange.endIndex; i++) {
      const item = items[i];
      const offsetTop = i * itemHeight;
      
      rendered.push(
        <div
          key={getItemKey(item, i)}
          style={{
            position: 'absolute',
            top: offsetTop,
            left: 0,
            right: 0,
            height: itemHeight,
          }}
          onClick={() => onItemClick?.(item, i)}
        >
          {renderItem(item, i)}
        </div>
      );
    }
    
    return rendered;
  }, [visibleRange, items, itemHeight, renderItem, getItemKey, onItemClick]);

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * Hook for managing tree expansion state
 */
export function useTreeExpansion(initialExpanded: Set<string> = new Set()) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpanded);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => new Set(prev).add(nodeId));
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const expandAll = useCallback((nodes: VirtualizedTreeNode[]) => {
    const allIds = new Set<string>();
    
    function collectIds(items: VirtualizedTreeNode[]) {
      for (const node of items) {
        if (node.children) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      }
    }
    
    collectIds(nodes);
    setExpandedNodes(allIds);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    expandedNodes,
    toggleNode,
    expandNode,
    collapseNode,
    expandAll,
    collapseAll,
  };
}
