/**
 * AI-Powered Drag & Drop Suggestions Hook
 *
 * Provides intelligent suggestions for file organization,
 * move operations, and project structure improvements
 */

import { useState, useCallback } from 'react';
import type { FileNode } from '@/components/layout/FileTree';

interface DragDropSuggestion {
  id: string;
  type: 'move' | 'organize' | 'rename' | 'group' | 'warning';
  title: string;
  description: string;
  confidence: number;
  action?: () => void;
  sourceFile?: string;
  targetFolder?: string;
}

interface UseDragDropAIOptions {
  enabled?: boolean;
  debounceMs?: number;
}

interface DragDropAIState {
  suggestions: DragDropSuggestion[];
  isAnalyzing: boolean;
  lastAnalyzedAt?: Date;
}

// File type categorization
const FILE_CATEGORIES: Record<string, string[]> = {
  components: ['.tsx', '.jsx', '.vue', '.svelte'],
  styles: ['.css', '.scss', '.sass', '.less', '.styled.ts'],
  tests: ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.test.js', '.spec.js'],
  types: ['.d.ts', '.types.ts', 'types.ts'],
  utilities: ['utils.ts', 'helpers.ts', 'lib.ts'],
  configs: ['.config.ts', '.config.js', 'rc.js', 'rc.json'],
  docs: ['.md', '.mdx', '.txt', '.doc'],
  assets: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'],
  data: ['.json', '.yaml', '.yml', '.xml', '.csv'],
  '3d': ['.scad', '.stl', '.obj', '.3mf'],
  diagrams: ['.mmd', '.mermaid', '.excalidraw', '.drawio'],
  java: ['.java', '.jar', '.war', '.class'],
};

// Suggested folder structure
const RECOMMENDED_STRUCTURE: Record<string, string> = {
  components: 'src/components',
  styles: 'src/styles',
  tests: '__tests__',
  types: 'src/types',
  utilities: 'src/lib',
  configs: '.',
  docs: 'docs',
  assets: 'public/assets',
  data: 'src/data',
  '3d': 'models',
  diagrams: 'docs/diagrams',
  java: 'src/main/java',
};

export function useDragDropAI(
  files: FileNode[],
  options: UseDragDropAIOptions = {}
): DragDropAIState & {
  analyzeDragDrop: (sourceId: string, targetId: string, position: string) => Promise<DragDropSuggestion[]>;
  analyzeFileStructure: () => Promise<DragDropSuggestion[]>;
  dismissSuggestion: (id: string) => void;
  applySuggestion: (id: string) => void;
} {
  const { enabled = true } = options;

  const [state, setState] = useState<DragDropAIState>({
    suggestions: [],
    isAnalyzing: false,
  });

  // Get file category based on extension/name
  const getFileCategory = useCallback((fileName: string): string | null => {
    const lowerName = fileName.toLowerCase();

    for (const [category, patterns] of Object.entries(FILE_CATEGORIES)) {
      for (const pattern of patterns) {
        if (lowerName.endsWith(pattern) || lowerName.includes(pattern)) {
          return category;
        }
      }
    }

    return null;
  }, []);

  // Find file by ID
  const findFileById = useCallback((id: string, nodes: FileNode[] = files): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFileById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [files]);

  // Get file path
  const getFilePath = useCallback((id: string, nodes: FileNode[] = files, path: string = ''): string => {
    for (const node of nodes) {
      const currentPath = path ? `${path}/${node.name}` : node.name;
      if (node.id === id) return currentPath;
      if (node.children) {
        const found = getFilePath(id, node.children, currentPath);
        if (found) return found;
      }
    }
    return '';
  }, [files]);

  // Analyze a specific drag-drop operation
  const analyzeDragDrop = useCallback(async (
    sourceId: string,
    targetId: string,
    position: string
  ): Promise<DragDropSuggestion[]> => {
    if (!enabled) return [];

    setState(prev => ({ ...prev, isAnalyzing: true }));

    const suggestions: DragDropSuggestion[] = [];
    const sourceFile = findFileById(sourceId);
    const targetFile = findFileById(targetId);

    if (!sourceFile || !targetFile) {
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return [];
    }

    // Check if moving to appropriate folder
    const sourceCategory = getFileCategory(sourceFile.name);
    const targetPath = getFilePath(targetId);

    if (sourceCategory) {
      const recommendedPath = RECOMMENDED_STRUCTURE[sourceCategory];

      if (recommendedPath && !targetPath.includes(recommendedPath.split('/').pop() || '')) {
        suggestions.push({
          id: `suggest-${Date.now()}-1`,
          type: 'organize',
          title: `Consider moving to ${recommendedPath}`,
          description: `${sourceFile.name} appears to be a ${sourceCategory} file. Consider organizing it in the ${recommendedPath} folder for better project structure.`,
          confidence: 0.7,
          sourceFile: sourceFile.name,
          targetFolder: recommendedPath,
        });
      }
    }

    // Check for mixing different file types
    if (targetFile.type === 'folder' && targetFile.children) {
      const existingCategories = new Set(
        targetFile.children
          .filter(c => c.type === 'file')
          .map(c => getFileCategory(c.name))
          .filter(Boolean)
      );

      if (sourceCategory && existingCategories.size > 0 && !existingCategories.has(sourceCategory)) {
        suggestions.push({
          id: `suggest-${Date.now()}-2`,
          type: 'warning',
          title: 'Mixed file types',
          description: `Moving ${sourceFile.name} (${sourceCategory}) into a folder containing ${Array.from(existingCategories).join(', ')} files. Consider creating a subfolder for better organization.`,
          confidence: 0.6,
        });
      }
    }

    // Suggest renaming for consistency
    if (sourceFile.type === 'file') {
      const hasUpperCase = /[A-Z]/.test(sourceFile.name.split('.')[0]);
      const hasKebabCase = sourceFile.name.includes('-');
      const hasSnakeCase = sourceFile.name.includes('_');

      // Check sibling naming conventions
      const parent = findParentFolder(sourceId, files);
      if (parent?.children) {
        const siblingStyles = parent.children
          .filter(c => c.type === 'file' && c.id !== sourceId)
          .map(c => {
            const name = c.name.split('.')[0];
            if (/^[A-Z]/.test(name)) return 'PascalCase';
            if (name.includes('-')) return 'kebab-case';
            if (name.includes('_')) return 'snake_case';
            return 'camelCase';
          });

        const dominantStyle = getMostCommon(siblingStyles);
        const sourceStyle = hasUpperCase ? 'PascalCase' :
                          hasKebabCase ? 'kebab-case' :
                          hasSnakeCase ? 'snake_case' : 'camelCase';

        if (dominantStyle && dominantStyle !== sourceStyle) {
          suggestions.push({
            id: `suggest-${Date.now()}-3`,
            type: 'rename',
            title: 'Inconsistent naming convention',
            description: `Consider renaming ${sourceFile.name} to match the ${dominantStyle} convention used by other files in this folder.`,
            confidence: 0.5,
          });
        }
      }
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      suggestions: [...prev.suggestions, ...suggestions],
      lastAnalyzedAt: new Date(),
    }));

    return suggestions;
  }, [enabled, findFileById, getFileCategory, getFilePath, files]);

  // Analyze entire file structure
  const analyzeFileStructure = useCallback(async (): Promise<DragDropSuggestion[]> => {
    if (!enabled) return [];

    setState(prev => ({ ...prev, isAnalyzing: true }));

    const suggestions: DragDropSuggestion[] = [];
    const misplacedFiles: Map<string, FileNode[]> = new Map();

    // Collect all files
    const collectFiles = (nodes: FileNode[], path: string = '') => {
      for (const node of nodes) {
        const currentPath = path ? `${path}/${node.name}` : node.name;

        if (node.type === 'file') {
          const category = getFileCategory(node.name);
          if (category) {
            const recommendedPath = RECOMMENDED_STRUCTURE[category];
            if (recommendedPath && !currentPath.startsWith(recommendedPath)) {
              if (!misplacedFiles.has(category)) {
                misplacedFiles.set(category, []);
              }
              misplacedFiles.get(category)!.push(node);
            }
          }
        }

        if (node.children) {
          collectFiles(node.children, currentPath);
        }
      }
    };

    collectFiles(files);

    // Generate suggestions for misplaced files
    for (const [category, categoryFiles] of Array.from(misplacedFiles.entries())) {
      if (categoryFiles.length >= 2) {
        suggestions.push({
          id: `structure-${category}`,
          type: 'group',
          title: `Group ${category} files`,
          description: `Found ${categoryFiles.length} ${category} files scattered across different locations. Consider moving them to ${RECOMMENDED_STRUCTURE[category]} for better organization.`,
          confidence: 0.8,
        });
      }
    }

    // Check for deep nesting
    const checkDepth = (nodes: FileNode[], depth: number = 0) => {
      for (const node of nodes) {
        if (depth > 5 && node.type === 'folder') {
          suggestions.push({
            id: `depth-${node.id}`,
            type: 'warning',
            title: 'Deep folder nesting',
            description: `"${node.name}" is nested ${depth} levels deep. Consider flattening the structure for easier navigation.`,
            confidence: 0.6,
          });
        }
        if (node.children) {
          checkDepth(node.children, depth + 1);
        }
      }
    };

    checkDepth(files);

    // Check for empty folders
    const checkEmpty = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'folder' && (!node.children || node.children.length === 0)) {
          suggestions.push({
            id: `empty-${node.id}`,
            type: 'warning',
            title: 'Empty folder',
            description: `"${node.name}" is empty. Consider removing it or adding relevant files.`,
            confidence: 0.4,
          });
        }
        if (node.children) {
          checkEmpty(node.children);
        }
      }
    };

    checkEmpty(files);

    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      suggestions,
      lastAnalyzedAt: new Date(),
    }));

    return suggestions;
  }, [enabled, files, getFileCategory]);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== id),
    }));
  }, []);

  // Apply a suggestion
  const applySuggestion = useCallback((id: string) => {
    const suggestion = state.suggestions.find(s => s.id === id);
    if (suggestion?.action) {
      suggestion.action();
    }
    dismissSuggestion(id);
  }, [state.suggestions, dismissSuggestion]);

  return {
    ...state,
    analyzeDragDrop,
    analyzeFileStructure,
    dismissSuggestion,
    applySuggestion,
  };
}

// Helper functions
function findParentFolder(childId: string, nodes: FileNode[], parent: FileNode | null = null): FileNode | null {
  for (const node of nodes) {
    if (node.id === childId) return parent;
    if (node.children) {
      const found = findParentFolder(childId, node.children, node);
      if (found !== null) return found;
    }
  }
  return null;
}

function getMostCommon<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;

  const counts = new Map<T, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommon: T | null = null;
  for (const [item, count] of Array.from(counts.entries())) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  }

  return mostCommon;
}

export type { DragDropSuggestion, UseDragDropAIOptions };
