/**
 * Workspace Manager - Document and Workspace Lifecycle Management
 * 
 * Manages the workspace state, open documents, and coordinates with other services
 */

export interface Document {
  id: string;
  uri: string;
  path: string;
  language: string;
  content: string;
  version: number;
  isDirty: boolean;
  isReadOnly?: boolean;
}

export interface WorkspaceConfig {
  name: string;
  rootPath: string;
  settings: Record<string, any>;
}

export type DocumentChangeListener = (document: Document) => void;
export type DocumentCloseListener = (documentId: string) => void;

/**
 * Workspace Manager Class
 * 
 * Central manager for workspace operations and document lifecycle
 */
export class WorkspaceManager {
  private documents: Map<string, Document> = new Map();
  private config: WorkspaceConfig;
  private changeListeners: Set<DocumentChangeListener> = new Set();
  private closeListeners: Set<DocumentCloseListener> = new Set();

  constructor(config?: Partial<WorkspaceConfig>) {
    this.config = {
      name: config?.name || 'Untitled Workspace',
      rootPath: config?.rootPath || '/',
      settings: config?.settings || {},
    };
    
    console.log('[WorkspaceManager] Initialized with config:', this.config.name);
  }

  /**
   * Open a document in the workspace
   */
  async openDocument(path: string, content: string, language: string = 'plaintext'): Promise<Document> {
    const uri = `file://${path}`;
    
    // Check if already open
    let document = this.documents.get(uri);
    if (document) {
      console.log(`[WorkspaceManager] Document already open: ${path}`);
      return document;
    }

    // Create new document
    document = {
      id: this.generateDocumentId(),
      uri,
      path,
      language,
      content,
      version: 1,
      isDirty: false,
    };

    this.documents.set(uri, document);
    console.log(`[WorkspaceManager] Document opened: ${path}`);

    return document;
  }

  /**
   * Close a document
   */
  async closeDocument(uri: string, saveIfDirty: boolean = false): Promise<boolean> {
    const document = this.documents.get(uri);
    if (!document) {
      return false;
    }

    if (saveIfDirty && document.isDirty) {
      await this.saveDocument(uri);
    }

    this.documents.delete(uri);
    console.log(`[WorkspaceManager] Document closed: ${uri}`);

    // Notify listeners
    this.closeListeners.forEach(listener => listener(document.id));

    return true;
  }

  /**
   * Update document content
   */
  updateDocument(uri: string, content: string): boolean {
    const document = this.documents.get(uri);
    if (!document) {
      return false;
    }

    document.content = content;
    document.version++;
    document.isDirty = true;

    console.log(`[WorkspaceManager] Document updated: ${uri} (v${document.version})`);

    // Notify listeners
    this.changeListeners.forEach(listener => listener(document));

    return true;
  }

  /**
   * Save a document
   */
  async saveDocument(uri: string): Promise<boolean> {
    const document = this.documents.get(uri);
    if (!document) {
      return false;
    }

    console.log(`[WorkspaceManager] TODO: Save document to disk: ${uri}`);
    
    // TODO: Implement actual file system save
    // This will require backend integration to write to disk
    
    document.isDirty = false;
    document.version++;

    console.log(`[WorkspaceManager] Document saved: ${uri}`);

    // Notify listeners
    this.changeListeners.forEach(listener => listener(document));

    return true;
  }

  /**
   * Get a document by URI
   */
  getDocument(uri: string): Document | undefined {
    return this.documents.get(uri);
  }

  /**
   * Get all open documents
   */
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Check if a document is open
   */
  isDocumentOpen(uri: string): boolean {
    return this.documents.has(uri);
  }

  /**
   * Get dirty documents
   */
  getDirtyDocuments(): Document[] {
    return Array.from(this.documents.values()).filter(doc => doc.isDirty);
  }

  /**
   * Save all dirty documents
   */
  async saveAll(): Promise<void> {
    const dirtyDocs = this.getDirtyDocuments();
    console.log(`[WorkspaceManager] Saving ${dirtyDocs.length} dirty documents`);

    for (const doc of dirtyDocs) {
      await this.saveDocument(doc.uri);
    }
  }

  /**
   * Close all documents
   */
  async closeAll(saveIfDirty: boolean = false): Promise<void> {
    const uris = Array.from(this.documents.keys());
    console.log(`[WorkspaceManager] Closing ${uris.length} documents`);

    for (const uri of uris) {
      await this.closeDocument(uri, saveIfDirty);
    }
  }

  /**
   * Add a change listener
   */
  onDocumentChange(listener: DocumentChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Add a close listener
   */
  onDocumentClose(listener: DocumentCloseListener): () => void {
    this.closeListeners.add(listener);
    return () => this.closeListeners.delete(listener);
  }

  /**
   * Get workspace configuration
   */
  getConfig(): WorkspaceConfig {
    return { ...this.config };
  }

  /**
   * Update workspace configuration
   */
  updateConfig(updates: Partial<WorkspaceConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      settings: {
        ...this.config.settings,
        ...updates.settings,
      },
    };

    console.log('[WorkspaceManager] Configuration updated');
  }

  /**
   * Generate a unique document ID
   */
  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown the workspace manager
   */
  async shutdown(): Promise<void> {
    console.log('[WorkspaceManager] Shutting down');
    
    // Close all documents
    await this.closeAll(false);
    
    // Clear listeners
    this.changeListeners.clear();
    this.closeListeners.clear();
  }
}

/**
 * Global workspace manager instance
 */
export const workspaceManager = new WorkspaceManager();
