/**
 * Kate Engine Type Definitions
 * 
 * Shared types and interfaces for communication between the Theia-based frontend
 * and the Kate text editor engine backend bridge.
 * 
 * These types define the protocol for:
 * - Buffer synchronization
 * - Syntax highlighting
 * - Code folding
 * - Search and replace
 * - Session management
 * 
 * TODO: Expand types as Kate engine integration progresses
 * TODO: Add JSDoc documentation for all interfaces
 * TODO: Define error types and error handling protocol
 * TODO: Add protocol versioning
 */

/**
 * Position in a text document (zero-based)
 */
export interface Position {
  /** Line number (0-based) */
  line: number;
  /** Column/character position (0-based) */
  column: number;
}

/**
 * Range in a text document
 */
export interface Range {
  /** Start position (inclusive) */
  start: Position;
  /** End position (exclusive) */
  end: Position;
}

/**
 * Text change operation
 * Used for synchronizing buffer changes between frontend and Kate engine
 * 
 * TODO: Add support for multi-cursor operations
 * TODO: Add change metadata (timestamp, author, etc.)
 */
export interface TextChange {
  /** Range being modified */
  range: Range;
  /** New text to insert (empty string for deletion) */
  text: string;
  /** Optional change ID for tracking */
  changeId?: string;
}

/**
 * Document buffer update message
 * Sent from frontend to backend when text is modified
 * 
 * TODO: Add conflict resolution strategy
 * TODO: Add undo/redo support
 */
export interface BufferUpdate {
  /** Unique document identifier */
  documentId: string;
  /** List of changes to apply */
  changes: TextChange[];
  /** Document version number for synchronization */
  version: number;
  /** Optional metadata */
  metadata?: {
    /** User who made the change */
    userId?: string;
    /** Timestamp of change */
    timestamp?: number;
  };
}

/**
 * Document metadata
 * Information about an open document
 * 
 * TODO: Add encoding information
 * TODO: Add line ending style (LF, CRLF, CR)
 * TODO: Add readonly status
 */
export interface DocumentMetadata {
  /** Unique document identifier */
  documentId: string;
  /** File path on disk */
  filePath: string;
  /** Programming language/syntax mode */
  language: string;
  /** Current document version */
  version: number;
  /** Whether document has unsaved changes */
  isDirty: boolean;
  /** File size in bytes */
  size?: number;
  /** Last modified timestamp */
  lastModified?: number;
}

/**
 * Syntax highlighting token
 * Represents a highlighted region in the text
 * 
 * TODO: Map Kate token types to Monaco/Theia token types
 * TODO: Add semantic highlighting support
 * TODO: Add custom theme support
 */
export interface SyntaxToken {
  /** Line number (0-based) */
  line: number;
  /** Start column (0-based, inclusive) */
  startColumn: number;
  /** End column (0-based, exclusive) */
  endColumn: number;
  /** Token type (e.g., 'keyword', 'string', 'comment') */
  tokenType: string;
  /** Optional scope information for semantic highlighting */
  scopes?: string[];
  /** Optional modifiers (bold, italic, etc.) */
  modifiers?: string[];
}

/**
 * Syntax highlighting response
 * Contains highlighting information for a range of lines
 * 
 * TODO: Add incremental highlighting updates
 * TODO: Support for asynchronous highlighting
 */
export interface SyntaxHighlighting {
  /** Document identifier */
  documentId: string;
  /** Start line (inclusive) */
  lineStart: number;
  /** End line (exclusive) */
  lineEnd: number;
  /** Array of syntax tokens */
  tokens: SyntaxToken[];
}

/**
 * Code folding region
 * Represents a foldable region in the code
 * 
 * TODO: Add support for nested folding
 * TODO: Add folding markers and decorations
 */
export interface FoldingRegion {
  /** Start line (0-based, inclusive) */
  startLine: number;
  /** End line (0-based, inclusive) */
  endLine: number;
  /** Folding kind (e.g., 'region', 'comment', 'imports') */
  kind?: 'comment' | 'imports' | 'region';
  /** Whether region is currently folded */
  isFolded?: boolean;
}

/**
 * Indentation information
 * Describes indentation style and level
 * 
 * TODO: Add auto-indent configuration
 * TODO: Add language-specific indentation rules
 */
export interface IndentationInfo {
  /** Use spaces (true) or tabs (false) */
  useSpaces: boolean;
  /** Number of spaces per indentation level */
  tabSize: number;
  /** Current indentation level */
  level: number;
}

/**
 * Search options
 * Configuration for search operations
 * 
 * TODO: Add regex pattern support
 * TODO: Add scope limitation (selection, file, project)
 */
export interface SearchOptions {
  /** Search query string */
  query: string;
  /** Case sensitive search */
  caseSensitive?: boolean;
  /** Whole word matching */
  wholeWord?: boolean;
  /** Use regular expression */
  useRegex?: boolean;
  /** Search backwards */
  backwards?: boolean;
}

/**
 * Search result
 * Single search match result
 * 
 * TODO: Add match preview/context
 * TODO: Add match highlighting information
 */
export interface SearchResult {
  /** Document identifier */
  documentId: string;
  /** Match range */
  range: Range;
  /** Matched text */
  text: string;
  /** Line content for context */
  lineContent?: string;
}

/**
 * Replace operation
 * Configuration for replace operations
 * 
 * TODO: Add capture group support for regex replace
 * TODO: Add preview mode
 */
export interface ReplaceOperation {
  /** Search options */
  search: SearchOptions;
  /** Replacement text */
  replaceText: string;
  /** Replace all occurrences */
  replaceAll?: boolean;
}

/**
 * Kate session information
 * Represents a saved editing session
 * 
 * TODO: Add session persistence
 * TODO: Add workspace information
 */
export interface KateSession {
  /** Session identifier */
  sessionId: string;
  /** Session name */
  name: string;
  /** List of open documents */
  documents: DocumentMetadata[];
  /** Active document ID */
  activeDocumentId?: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessed: number;
}

/**
 * Kate engine status
 * Information about the Kate engine state
 * 
 * TODO: Add performance metrics
 * TODO: Add plugin/extension status
 */
export interface KateEngineStatus {
  /** Whether engine is initialized */
  initialized: boolean;
  /** Engine version */
  version?: string;
  /** Number of open documents */
  documentCount: number;
  /** Available syntax highlighters */
  availableLanguages?: string[];
  /** Engine capabilities */
  capabilities?: {
    syntaxHighlighting: boolean;
    codeFolding: boolean;
    smartIndentation: boolean;
    search: boolean;
    multiCursor: boolean;
  };
}

/**
 * WebSocket message types
 * Defines all message types for frontend-backend communication
 * 
 * TODO: Add request/response correlation IDs
 * TODO: Add message priority
 */
export type MessageType =
  // Connection
  | 'connection.init'
  | 'connection.ack'
  | 'connection.error'
  
  // Buffer operations
  | 'buffer.open'
  | 'buffer.opened'
  | 'buffer.update'
  | 'buffer.updated'
  | 'buffer.close'
  | 'buffer.closed'
  | 'buffer.save'
  | 'buffer.saved'
  
  // Syntax highlighting
  | 'syntax.request'
  | 'syntax.response'
  | 'syntax.update'
  
  // Code folding
  | 'fold.request'
  | 'fold.response'
  | 'fold.toggle'
  
  // Search and replace
  | 'search.request'
  | 'search.response'
  | 'search.replace'
  
  // Session management
  | 'session.create'
  | 'session.load'
  | 'session.save'
  | 'session.delete'
  
  // Status and diagnostics
  | 'status.request'
  | 'status.response'
  | 'error';

/**
 * Base message structure
 * All WebSocket messages follow this structure
 * 
 * TODO: Add message authentication
 * TODO: Add message compression for large payloads
 */
export interface Message<T = any> {
  /** Message type */
  type: MessageType;
  /** Message payload */
  payload: T;
  /** Optional request ID for correlation */
  requestId?: string;
  /** Message timestamp */
  timestamp?: number;
}

/**
 * Error message payload
 * Sent when an error occurs
 * 
 * TODO: Add error codes
 * TODO: Add stack traces for debugging
 */
export interface ErrorPayload {
  /** Error message */
  error: string;
  /** Error code (if applicable) */
  code?: string;
  /** Additional error details */
  details?: any;
}

/**
 * Type guard for checking message types
 */
export function isMessage(data: any): data is Message {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'payload' in data
  );
}

/**
 * Helper to create typed messages
 */
export function createMessage<T>(
  type: MessageType,
  payload: T,
  requestId?: string
): Message<T> {
  return {
    type,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}
