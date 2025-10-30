/**
 * LSP Manager - Language Server Protocol Integration
 * 
 * Manages language server connections and provides LSP features like:
 * - Code completion
 * - Hover information
 * - Diagnostics
 * - Document symbols
 * - Formatting
 */

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextDocument {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export interface CompletionItem {
  label: string;
  kind: CompletionItemKind;
  detail?: string;
  documentation?: string;
  sortText?: string;
  insertText?: string;
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Unit = 11,
  Value = 12,
  Enum = 13,
  Keyword = 14,
  Snippet = 15,
  Color = 16,
  File = 17,
  Reference = 18,
}

export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  message: string;
  source?: string;
  code?: string | number;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface Hover {
  contents: string;
  range?: Range;
}

export interface DocumentSymbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
}

/**
 * Language Server instance
 */
export interface LanguageServer {
  languageId: string;
  capabilities: ServerCapabilities;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  completionProvider?: boolean;
  hoverProvider?: boolean;
  diagnosticProvider?: boolean;
  documentSymbolProvider?: boolean;
  documentFormattingProvider?: boolean;
  signatureHelpProvider?: boolean;
}

/**
 * LSP Manager Class
 * 
 * Manages connections to language servers and coordinates LSP features
 */
export class LSPManager {
  private servers: Map<string, LanguageServer> = new Map();
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private documents: Map<string, TextDocument> = new Map();
  private diagnosticsCallbacks: Set<(uri: string, diagnostics: Diagnostic[]) => void> = new Set();

  constructor() {
    console.log('[LSPManager] Initialized');
    this.setupDiagnosticsListener();
  }

  /**
   * Setup diagnostics listener via API
   */
  private setupDiagnosticsListener(): void {
    // Poll for diagnostics updates periodically
    setInterval(() => {
      this.fetchDiagnostics();
    }, 1000);
  }

  /**
   * Fetch diagnostics from backend
   */
  private async fetchDiagnostics(): Promise<void> {
    for (const uri of this.documents.keys()) {
      try {
        const response = await fetch(`/api/lsp/diagnostics?uri=${encodeURIComponent(uri)}`);
        if (response.ok) {
          const diagnostics = await response.json();
          this.setDiagnostics(uri, diagnostics);
        }
      } catch (error) {
        // Silently fail - diagnostics are not critical
      }
    }
  }

  /**
   * Initialize a language server for a specific language
   */
  async initializeServer(languageId: string): Promise<void> {
    console.log(`[LSPManager] Initializing language server for ${languageId}`);
    
    try {
      // Request backend to initialize the language server
      const response = await fetch('/api/lsp/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageId })
      });

      if (!response.ok) {
        console.error(`[LSPManager] Failed to initialize ${languageId} server`);
        return;
      }

      const data = await response.json();
      
      // Create server wrapper
      const server: LanguageServer = {
        languageId,
        capabilities: data.capabilities || {
          completionProvider: true,
          hoverProvider: true,
          diagnosticProvider: true,
          documentSymbolProvider: true,
        },
        initialize: async () => {
          console.log(`[LSPManager] Server initialized for ${languageId}`);
        },
        shutdown: async () => {
          await fetch(`/api/lsp/shutdown/${languageId}`, { method: 'POST' });
          console.log(`[LSPManager] Server shutdown for ${languageId}`);
        },
      };

      await server.initialize();
      this.servers.set(languageId, server);
      console.log(`[LSPManager] ${languageId} server ready`);
    } catch (error) {
      console.error(`[LSPManager] Error initializing ${languageId} server:`, error);
    }
  }

  /**
   * Register a text document with the LSP
   */
  async didOpenTextDocument(document: TextDocument): Promise<void> {
    this.documents.set(document.uri, document);
    
    const server = this.servers.get(document.languageId);
    if (!server) {
      await this.initializeServer(document.languageId);
    }
    
    console.log(`[LSPManager] Document opened: ${document.uri}`);
    
    // Send didOpen to backend
    try {
      await fetch('/api/lsp/document/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uri: document.uri,
          languageId: document.languageId,
          version: document.version,
          text: document.text
        })
      });
    } catch (error) {
      console.error('[LSPManager] Error opening document:', error);
    }
  }

  /**
   * Notify LSP of document changes
   */
  async didChangeTextDocument(uri: string, text: string, version: number): Promise<void> {
    const document = this.documents.get(uri);
    if (document) {
      document.text = text;
      document.version = version;
    }
    
    console.log(`[LSPManager] Document changed: ${uri}`);
    
    // Send didChange to backend
    try {
      await fetch('/api/lsp/document/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uri,
          text,
          version
        })
      });
    } catch (error) {
      console.error('[LSPManager] Error updating document:', error);
    }
  }

  /**
   * Close a text document
   */
  async didCloseTextDocument(uri: string): Promise<void> {
    this.documents.delete(uri);
    this.diagnostics.delete(uri);
    
    console.log(`[LSPManager] Document closed: ${uri}`);
    
    // Send didClose to backend
    try {
      await fetch('/api/lsp/document/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });
    } catch (error) {
      console.error('[LSPManager] Error closing document:', error);
    }
  }

  /**
   * Request code completions
   */
  async provideCompletions(
    uri: string,
    position: Position
  ): Promise<CompletionItem[]> {
    const document = this.documents.get(uri);
    if (!document) {
      return [];
    }

    const server = this.servers.get(document.languageId);
    if (!server || !server.capabilities.completionProvider) {
      return [];
    }

    try {
      const response = await fetch('/api/lsp/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, position })
      });

      if (!response.ok) return [];
      
      const completions = await response.json();
      return completions || [];
    } catch (error) {
      console.error('[LSPManager] Completion error:', error);
      return [];
    }
  }

  /**
   * Request hover information
   */
  async provideHover(uri: string, position: Position): Promise<Hover | null> {
    const document = this.documents.get(uri);
    if (!document) {
      return null;
    }

    const server = this.servers.get(document.languageId);
    if (!server || !server.capabilities.hoverProvider) {
      return null;
    }

    try {
      const response = await fetch('/api/lsp/hover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, position })
      });

      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('[LSPService] Hover error:', error);
      return null;
    }
  }

  /**
   * Go to definition
   */
  async gotoDefinition(uri: string, position: Position): Promise<any> {
    const document = this.documents.get(uri);
    if (!document) {
      return null;
    }

    try {
      const response = await fetch('/api/lsp/definition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, position })
      });

      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('[LSPManager] Definition error:', error);
      return null;
    }
  }

  /**
   * Find references
   */
  async findReferences(uri: string, position: Position): Promise<any[]> {
    const document = this.documents.get(uri);
    if (!document) {
      return [];
    }

    try {
      const response = await fetch('/api/lsp/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, position })
      });

      if (!response.ok) return [];
      
      return await response.json();
    } catch (error) {
      console.error('[LSPManager] References error:', error);
      return [];
    }
  }

  /**
   * Get diagnostics for a document
   */
  getDiagnostics(uri: string): Diagnostic[] {
    return this.diagnostics.get(uri) || [];
  }

  /**
   * Update diagnostics for a document
   */
  setDiagnostics(uri: string, diagnostics: Diagnostic[]): void {
    this.diagnostics.set(uri, diagnostics);
    console.log(`[LSPManager] Diagnostics updated for ${uri}: ${diagnostics.length} issues`);
    
    // Notify all callbacks
    for (const callback of this.diagnosticsCallbacks) {
      callback(uri, diagnostics);
    }
  }

  /**
   * Subscribe to diagnostics updates
   */
  onDiagnostics(callback: (uri: string, diagnostics: Diagnostic[]) => void): () => void {
    this.diagnosticsCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.diagnosticsCallbacks.delete(callback);
    };
  }

  /**
   * Request document symbols
   */
  async provideDocumentSymbols(uri: string): Promise<DocumentSymbol[]> {
    const document = this.documents.get(uri);
    if (!document) {
      return [];
    }

    const server = this.servers.get(document.languageId);
    if (!server || !server.capabilities.documentSymbolProvider) {
      return [];
    }

    try {
      const response = await fetch(`/api/lsp/symbols?uri=${encodeURIComponent(uri)}`);
      if (!response.ok) return [];
      
      return await response.json();
    } catch (error) {
      console.error('[LSPManager] Document symbols error:', error);
      return [];
    }
  }

  /**
   * Format document
   */
  async formatDocument(uri: string): Promise<{ range: Range; newText: string }[]> {
    const document = this.documents.get(uri);
    if (!document) {
      return [];
    }

    const server = this.servers.get(document.languageId);
    if (!server || !server.capabilities.documentFormattingProvider) {
      return [];
    }

    try {
      const response = await fetch('/api/lsp/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri })
      });

      if (!response.ok) return [];
      
      return await response.json();
    } catch (error) {
      console.error('[LSPManager] Formatting error:', error);
      return [];
    }
  }

  /**
   * Shutdown all language servers
   */
  async shutdown(): Promise<void> {
    console.log('[LSPManager] Shutting down all language servers');
    
    const servers = Array.from(this.servers.values());
    for (const server of servers) {
      await server.shutdown();
    }
    
    this.servers.clear();
    this.documents.clear();
    this.diagnostics.clear();
  }
}

/**
 * Global LSP Manager instance
 */
export const lspManager = new LSPManager();
