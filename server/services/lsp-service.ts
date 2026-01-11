/**
 * LSP Service - Language Server Protocol Integration
 * 
 * Manages language server processes and provides LSP features like:
 * - Code completion
 * - Go to definition
 * - Find references
 * - Diagnostics
 * - Hover information
 * - Document symbols
 */

import { ChildProcess, spawn } from 'child_process';
import * as lsp from 'vscode-languageserver-protocol';
import { StreamMessageReader, StreamMessageWriter, createMessageConnection, MessageConnection } from 'vscode-jsonrpc/node';
import { LSPServerConfig, getLSPConfigForLanguage } from './lsp-configs';

interface LSPServerConnection {
  languageId: string;
  config: LSPServerConfig;
  process: ChildProcess;
  connection: MessageConnection;
  capabilities: lsp.ServerCapabilities;
  rootUri: string;
}

interface DocumentInfo {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

export class LSPService {
  private servers: Map<string, LSPServerConnection> = new Map();
  private documents: Map<string, DocumentInfo> = new Map();
  private diagnosticsCallbacks: Set<(uri: string, diagnostics: lsp.Diagnostic[]) => void> = new Set();
  private rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
    console.log('[LSPService] Initialized with root path:', rootPath);
  }

  /**
   * Initialize a language server for a specific language
   */
  async initializeServer(languageId: string, config?: LSPServerConfig): Promise<boolean> {
    // Check if server already running
    if (this.servers.has(languageId)) {
      console.log(`[LSPService] Server already running for ${languageId}`);
      return true;
    }

    // Get configuration
    const serverConfig = config || getLSPConfigForLanguage(languageId);
    if (!serverConfig) {
      console.warn(`[LSPService] No configuration found for ${languageId}`);
      return false;
    }

    try {
      console.log(`[LSPService] Starting language server for ${languageId}:`, serverConfig.command);
      
      // Spawn language server process
      const serverProcess = spawn(serverConfig.command, serverConfig.args, {
        env: { ...process.env, ...serverConfig.env },
        cwd: serverConfig.cwd || this.rootPath,
        stdio: 'pipe'
      });

      // Handle process errors
      serverProcess.on('error', (err) => {
        console.error(`[LSPService] Failed to start ${languageId} server:`, err);
        this.servers.delete(languageId);
      });

      serverProcess.on('exit', (code) => {
        console.log(`[LSPService] ${languageId} server exited with code ${code}`);
        this.servers.delete(languageId);
      });

      // Create JSON-RPC connection
      const reader = new StreamMessageReader(serverProcess.stdout!);
      const writer = new StreamMessageWriter(serverProcess.stdin!);
      const connection = createMessageConnection(reader, writer);

      // Handle server notifications
      connection.onNotification(lsp.PublishDiagnosticsNotification.type, (params: lsp.PublishDiagnosticsParams) => {
        this.handleDiagnostics(params);
      });

      // Start listening
      connection.listen();

      // Send initialize request
      const rootUri = `file://${this.rootPath}`;
      const initializeParams: lsp.InitializeParams = {
        processId: process.pid,
        rootUri,
        rootPath: this.rootPath,
        capabilities: {
          textDocument: {
            completion: {
              completionItem: {
                snippetSupport: true,
                documentationFormat: [lsp.MarkupKind.Markdown, lsp.MarkupKind.PlainText]
              }
            },
            hover: {
              contentFormat: [lsp.MarkupKind.Markdown, lsp.MarkupKind.PlainText]
            },
            synchronization: {
              dynamicRegistration: true,
              didSave: true
            },
            definition: { dynamicRegistration: true },
            references: { dynamicRegistration: true },
            documentSymbol: { dynamicRegistration: true }
          },
          workspace: {
            workspaceFolders: true,
            configuration: true
          }
        },
        initializationOptions: serverConfig.initializationOptions,
        workspaceFolders: [{
          uri: rootUri,
          name: 'workspace'
        }]
      };

      const initializeResult = await connection.sendRequest(
        lsp.InitializeRequest.type,
        initializeParams
      ) as lsp.InitializeResult;

      // Send initialized notification
      await connection.sendNotification(lsp.InitializedNotification.type, {});

      // Store server connection
      this.servers.set(languageId, {
        languageId,
        config: serverConfig,
        process: serverProcess,
        connection,
        capabilities: initializeResult.capabilities,
        rootUri
      });

      console.log(`[LSPService] ${languageId} server initialized successfully`);
      console.log(`[LSPService] Server capabilities:`, initializeResult.capabilities);
      
      return true;
    } catch (error) {
      console.error(`[LSPService] Failed to initialize ${languageId} server:`, error);
      return false;
    }
  }

  /**
   * Get server connection for a language
   */
  private getServer(languageId: string): LSPServerConnection | null {
    return this.servers.get(languageId) || null;
  }

  /**
   * Get server for a document
   */
  private getServerForDocument(uri: string): LSPServerConnection | null {
    const doc = this.documents.get(uri);
    if (!doc) return null;
    return this.getServer(doc.languageId);
  }

  /**
   * Register a document with the LSP
   */
  async didOpenTextDocument(uri: string, languageId: string, version: number, text: string): Promise<void> {
    // Store document
    this.documents.set(uri, { uri, languageId, version, text });

    // Initialize server if needed
    if (!this.servers.has(languageId)) {
      await this.initializeServer(languageId);
    }

    const server = this.getServer(languageId);
    if (!server) {
      console.warn(`[LSPService] No server available for ${languageId}`);
      return;
    }

    // Send didOpen notification
    const params: lsp.DidOpenTextDocumentParams = {
      textDocument: {
        uri,
        languageId,
        version,
        text
      }
    };

    await server.connection.sendNotification(lsp.DidOpenTextDocumentNotification.type, params);
    console.log(`[LSPService] Document opened: ${uri}`);
  }

  /**
   * Notify LSP of document changes
   */
  async didChangeTextDocument(uri: string, changes: lsp.TextDocumentContentChangeEvent[], version: number): Promise<void> {
    const doc = this.documents.get(uri);
    if (!doc) {
      console.warn(`[LSPService] Document not registered: ${uri}`);
      return;
    }

    // Update document version
    doc.version = version;
    
    // Update full text if provided
    if (changes.length > 0 && 'text' in changes[0]) {
      doc.text = changes[0].text;
    }

    const server = this.getServerForDocument(uri);
    if (!server) return;

    const params: lsp.DidChangeTextDocumentParams = {
      textDocument: {
        uri,
        version
      },
      contentChanges: changes
    };

    await server.connection.sendNotification(lsp.DidChangeTextDocumentNotification.type, params);
  }

  /**
   * Close a text document
   */
  async didCloseTextDocument(uri: string): Promise<void> {
    const server = this.getServerForDocument(uri);
    this.documents.delete(uri);

    if (!server) return;

    const params: lsp.DidCloseTextDocumentParams = {
      textDocument: { uri }
    };

    await server.connection.sendNotification(lsp.DidCloseTextDocumentNotification.type, params);
    console.log(`[LSPService] Document closed: ${uri}`);
  }

  /**
   * Request code completions
   */
  async provideCompletions(
    uri: string,
    position: lsp.Position
  ): Promise<lsp.CompletionItem[]> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.completionProvider) {
      return [];
    }

    try {
      const params: lsp.CompletionParams = {
        textDocument: { uri },
        position
      };

      const result = await server.connection.sendRequest(
        lsp.CompletionRequest.type,
        params
      ) as lsp.CompletionItem[] | lsp.CompletionList | null;

      if (!result) return [];
      
      // Handle both CompletionList and CompletionItem[]
      if (Array.isArray(result)) {
        return result;
      } else {
        return result.items || [];
      }
    } catch (error) {
      console.error('[LSPService] Completion error:', error);
      return [];
    }
  }

  /**
   * Request hover information
   */
  async provideHover(uri: string, position: lsp.Position): Promise<lsp.Hover | null> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.hoverProvider) {
      return null;
    }

    try {
      const params: lsp.HoverParams = {
        textDocument: { uri },
        position
      };

      const result = await server.connection.sendRequest(
        lsp.HoverRequest.type,
        params
      ) as lsp.Hover | null;

      return result || null;
    } catch (error) {
      console.error('[LSPService] Hover error:', error);
      return null;
    }
  }

  /**
   * Go to definition
   */
  async gotoDefinition(uri: string, position: lsp.Position): Promise<lsp.Location | lsp.Location[] | null> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.definitionProvider) {
      return null;
    }

    try {
      const params: lsp.DefinitionParams = {
        textDocument: { uri },
        position
      };

      const result = await server.connection.sendRequest(
        lsp.DefinitionRequest.type,
        params
      ) as lsp.Location | lsp.Location[] | null;

      return result || null;
    } catch (error) {
      console.error('[LSPService] Definition error:', error);
      return null;
    }
  }

  /**
   * Find references
   */
  async findReferences(uri: string, position: lsp.Position, includeDeclaration: boolean = true): Promise<lsp.Location[]> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.referencesProvider) {
      return [];
    }

    try {
      const params: lsp.ReferenceParams = {
        textDocument: { uri },
        position,
        context: { includeDeclaration }
      };

      const result = await server.connection.sendRequest(
        lsp.ReferencesRequest.type,
        params
      ) as lsp.Location[] | null;

      return result || [];
    } catch (error) {
      console.error('[LSPService] References error:', error);
      return [];
    }
  }

  /**
   * Request document symbols
   */
  async provideDocumentSymbols(uri: string): Promise<lsp.DocumentSymbol[]> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.documentSymbolProvider) {
      return [];
    }

    try {
      const params: lsp.DocumentSymbolParams = {
        textDocument: { uri }
      };

      const result = await server.connection.sendRequest(
        lsp.DocumentSymbolRequest.type,
        params
      ) as lsp.DocumentSymbol[] | null;

      return result || [];
    } catch (error) {
      console.error('[LSPService] Document symbols error:', error);
      return [];
    }
  }

  /**
   * Format document
   */
  async formatDocument(uri: string, options: lsp.FormattingOptions): Promise<lsp.TextEdit[]> {
    const server = this.getServerForDocument(uri);
    if (!server || !server.capabilities.documentFormattingProvider) {
      return [];
    }

    try {
      const params: lsp.DocumentFormattingParams = {
        textDocument: { uri },
        options
      };

      const result = await server.connection.sendRequest(
        lsp.DocumentFormattingRequest.type,
        params
      ) as lsp.TextEdit[] | null;

      return result || [];
    } catch (error) {
      console.error('[LSPService] Formatting error:', error);
      return [];
    }
  }

  /**
   * Handle diagnostics from language server
   */
  private handleDiagnostics(params: lsp.PublishDiagnosticsParams): void {
    console.log(`[LSPService] Diagnostics for ${params.uri}: ${params.diagnostics.length} issues`);
    
    // Notify all callbacks
    for (const callback of this.diagnosticsCallbacks) {
      callback(params.uri, params.diagnostics);
    }
  }

  /**
   * Subscribe to diagnostics updates
   */
  onDiagnostics(callback: (uri: string, diagnostics: lsp.Diagnostic[]) => void): () => void {
    this.diagnosticsCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.diagnosticsCallbacks.delete(callback);
    };
  }

  /**
   * Check if a server is running for a language
   */
  isServerRunning(languageId: string): boolean {
    return this.servers.has(languageId);
  }

  /**
   * Get list of running servers
   */
  getRunningServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get server capabilities for a language
   */
  getServerCapabilities(languageId: string): lsp.ServerCapabilities | null {
    const server = this.getServer(languageId);
    return server ? server.capabilities : null;
  }

  /**
   * Shutdown a specific language server
   */
  async shutdownServer(languageId: string): Promise<void> {
    const server = this.servers.get(languageId);
    if (!server) return;

    console.log(`[LSPService] Shutting down ${languageId} server`);
    
    try {
      await server.connection.sendRequest(lsp.ShutdownRequest.type);
      await server.connection.sendNotification(lsp.ExitNotification.type);
      server.connection.dispose();
      server.process.kill();
    } catch (error) {
      console.error(`[LSPService] Error shutting down ${languageId} server:`, error);
      server.process.kill('SIGKILL');
    }
    
    this.servers.delete(languageId);
  }

  /**
   * Shutdown all language servers
   */
  async shutdown(): Promise<void> {
    console.log('[LSPService] Shutting down all language servers');
    
    const servers = Array.from(this.servers.keys());
    for (const languageId of servers) {
      await this.shutdownServer(languageId);
    }
    
    this.documents.clear();
    this.diagnosticsCallbacks.clear();
  }
}

// Export singleton instance
export const lspService = new LSPService();
