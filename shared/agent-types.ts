/**
 * Agent Types
 *
 * Defines types for the AI coding agent that can read/write files,
 * generate code, and execute multi-step tasks.
 */

import { ChatMessage } from './ai-types.js';

/**
 * Agent operation types
 */
export type AgentOperationType =
  | 'read_file'
  | 'write_file'
  | 'list_files'
  | 'generate_code'
  | 'modify_code'
  | 'create_component'
  | 'refactor'
  | 'analyze_project'
  | 'run_command'
  | 'multi_step_task';

/**
 * File operation request
 */
export interface FileOperationRequest {
  operation: 'read' | 'write' | 'list' | 'delete';
  path: string;
  content?: string;
  recursive?: boolean;
}

/**
 * File operation response
 */
export interface FileOperationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Agent task request
 */
export interface AgentTaskRequest {
  type: AgentOperationType;
  description: string;
  files?: string[]; // Files to include in context
  targetFile?: string; // File to modify/create
  code?: string; // Existing code to modify
  language?: string;
  instruction?: string; // Custom instruction
  context?: Record<string, any>; // Additional context
}

/**
 * Agent task step
 */
export interface AgentTaskStep {
  id: string;
  type: AgentOperationType;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
}

/**
 * Agent task response
 */
export interface AgentTaskResponse {
  success: boolean;
  taskId?: string;
  steps?: AgentTaskStep[];
  result?: any;
  generatedCode?: string;
  modifiedFiles?: string[];
  error?: string;
}

/**
 * Agent conversation context
 */
export interface AgentContext {
  taskId: string;
  workingDirectory: string;
  files: Map<string, string>; // path -> content
  projectStructure?: string[];
  messages: ChatMessage[];
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Agent capabilities
 */
export interface AgentCapabilities {
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canExecuteCommands: boolean;
  canAnalyzeProject: boolean;
  maxFileSize: number;
  maxConcurrentTasks: number;
}

/**
 * Code generation request
 */
export interface CodeGenerationRequest {
  description: string;
  language: string;
  framework?: string;
  style?: string; // 'functional' | 'class' | 'hooks'
  context?: string[]; // Related files for context
  targetFile?: string;
}

/**
 * Code generation response
 */
export interface CodeGenerationResponse {
  success: boolean;
  code?: string;
  explanation?: string;
  suggestedFileName?: string;
  dependencies?: string[];
  error?: string;
}

/**
 * Code modification request
 */
export interface CodeModificationRequest {
  file: string;
  originalCode: string;
  instruction: string;
  language: string;
  preserveImports?: boolean;
  preserveComments?: boolean;
}

/**
 * Code modification response
 */
export interface CodeModificationResponse {
  success: boolean;
  modifiedCode?: string;
  changes?: string; // Description of changes
  error?: string;
}

/**
 * Project analysis request
 */
export interface ProjectAnalysisRequest {
  rootPath: string;
  includePatterns?: string[]; // e.g., ['src/**/*.ts', 'lib/**/*.js']
  excludePatterns?: string[]; // e.g., ['node_modules/**', 'dist/**']
  analysisType?: 'structure' | 'dependencies' | 'tech_stack' | 'all';
}

/**
 * Project analysis response
 */
export interface ProjectAnalysisResponse {
  success: boolean;
  structure?: {
    directories: string[];
    files: string[];
    totalFiles: number;
    totalSize: number;
  };
  techStack?: {
    languages: Record<string, number>; // language -> file count
    frameworks: string[];
    dependencies: Record<string, string>;
  };
  recommendations?: string[];
  error?: string;
}

/**
 * Agent mode
 */
export type AgentMode = 'chat' | 'agent' | 'autonomous';

/**
 * Agent settings
 */
export interface AgentSettings {
  mode: AgentMode;
  autoExecute: boolean; // Auto-execute file operations without confirmation
  confirmFileWrites: boolean; // Ask before writing files
  maxTokensPerTask: number;
  includeProjectContext: boolean; // Include project structure in prompts
  workingDirectory?: string;
}
