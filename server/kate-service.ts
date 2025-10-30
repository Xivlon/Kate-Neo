/**
 * Kate Service - Backend service for managing Kate native module
 * 
 * Provides a service layer that manages Kate documents and integrates
 * the native module with the WebSocket bridge.
 */

import type { 
    DocumentMetadata, 
    BufferUpdate, 
    TextChange,
    SyntaxToken 
} from '../shared/kate-types';

// Try to import native module - may not be available
let kateNative: any = null;
let isNativeAvailable = false;

try {
    kateNative = require('@kate-neo/native');
    isNativeAvailable = kateNative?.isKateAvailable() || false;
} catch (error) {
    console.warn('[KateService] Native module not available:', (error as Error).message);
    console.warn('[KateService] Running without KTextEditor support');
}

/**
 * Document wrapper that abstracts native Kate document
 */
class KateDocument {
    private nativeDoc: any | null = null;
    private metadata: DocumentMetadata;
    private content: string = '';

    constructor(
        public readonly documentId: string,
        public readonly filePath: string,
        language: string,
        initialContent: string = ''
    ) {
        this.metadata = {
            documentId,
            filePath,
            language,
            version: 0,
            isDirty: false,
        };

        // Try to create native document
        if (isNativeAvailable && kateNative) {
            try {
                this.nativeDoc = kateNative.createDocument();
                if (initialContent) {
                    this.nativeDoc.setText(initialContent);
                }
                this.nativeDoc.setMode(language);
            } catch (error) {
                console.error('[KateDocument] Failed to create native document:', error);
                this.nativeDoc = null;
            }
        }

        // Fallback to in-memory content
        if (!this.nativeDoc) {
            this.content = initialContent;
        }
    }

    /**
     * Get document text
     */
    getText(): string {
        if (this.nativeDoc) {
            return this.nativeDoc.getText();
        }
        return this.content;
    }

    /**
     * Set document text
     */
    setText(text: string): void {
        if (this.nativeDoc) {
            this.nativeDoc.setText(text);
        } else {
            this.content = text;
        }
        this.metadata.isDirty = true;
        this.metadata.version++;
    }

    /**
     * Get specific line
     */
    getLine(lineNum: number): string {
        if (this.nativeDoc) {
            return this.nativeDoc.line(lineNum);
        }
        const lines = this.content.split('\n');
        return lines[lineNum] || '';
    }

    /**
     * Get line count
     */
    getLineCount(): number {
        if (this.nativeDoc) {
            return this.nativeDoc.lineCount();
        }
        return this.content.split('\n').length;
    }

    /**
     * Insert text at position
     */
    insertText(line: number, column: number, text: string): void {
        if (this.nativeDoc) {
            this.nativeDoc.insertText(line, column, text);
        } else {
            // Simple fallback implementation
            const lines = this.content.split('\n');
            if (line < lines.length) {
                const lineText = lines[line];
                lines[line] = lineText.slice(0, column) + text + lineText.slice(column);
                this.content = lines.join('\n');
            }
        }
        this.metadata.isDirty = true;
        this.metadata.version++;
    }

    /**
     * Remove text in range
     */
    removeText(startLine: number, startCol: number, endLine: number, endCol: number): void {
        if (this.nativeDoc) {
            this.nativeDoc.removeText(startLine, startCol, endLine, endCol);
        } else {
            // Simple fallback implementation
            const lines = this.content.split('\n');
            if (startLine === endLine) {
                const line = lines[startLine];
                lines[startLine] = line.slice(0, startCol) + line.slice(endCol);
            }
            this.content = lines.join('\n');
        }
        this.metadata.isDirty = true;
        this.metadata.version++;
    }

    /**
     * Apply a change
     */
    applyChange(change: TextChange): void {
        const { range, text } = change;
        
        // Remove old text if range is not empty
        if (range.start.line !== range.end.line || 
            range.start.column !== range.end.column) {
            this.removeText(
                range.start.line,
                range.start.column,
                range.end.line,
                range.end.column
            );
        }

        // Insert new text
        if (text) {
            this.insertText(range.start.line, range.start.column, text);
        }
    }

    /**
     * Get syntax mode
     */
    getMode(): string {
        if (this.nativeDoc) {
            return this.nativeDoc.mode();
        }
        return this.metadata.language;
    }

    /**
     * Set syntax mode
     */
    setMode(mode: string): void {
        if (this.nativeDoc) {
            this.nativeDoc.setMode(mode);
        }
        this.metadata.language = mode;
    }

    /**
     * Open file from URL
     */
    async openUrl(url: string): Promise<boolean> {
        if (this.nativeDoc) {
            return this.nativeDoc.openUrl(url);
        }
        return false;
    }

    /**
     * Save document
     */
    async save(): Promise<boolean> {
        if (this.nativeDoc) {
            const success = this.nativeDoc.saveUrl();
            if (success) {
                this.metadata.isDirty = false;
            }
            return success;
        }
        return false;
    }

    /**
     * Get metadata
     */
    getMetadata(): DocumentMetadata {
        return { ...this.metadata };
    }

    /**
     * Undo
     */
    undo(): void {
        if (this.nativeDoc) {
            this.nativeDoc.undo();
        }
    }

    /**
     * Redo
     */
    redo(): void {
        if (this.nativeDoc) {
            this.nativeDoc.redo();
        }
    }

    /**
     * Is modified
     */
    isModified(): boolean {
        if (this.nativeDoc) {
            return this.nativeDoc.isModified();
        }
        return this.metadata.isDirty;
    }

    /**
     * Get syntax tokens for a line range (Phase 7)
     */
    getSyntaxTokens(lineStart: number, lineEnd: number): SyntaxToken[] {
        if (this.nativeDoc && this.nativeDoc.getSyntaxTokens) {
            return this.nativeDoc.getSyntaxTokens(lineStart, lineEnd);
        }
        // Fallback: return empty array
        return [];
    }

    /**
     * Get folding regions (Phase 7)
     */
    getFoldingRegions(): any[] {
        if (this.nativeDoc && this.nativeDoc.getFoldingRegions) {
            return this.nativeDoc.getFoldingRegions();
        }
        // Fallback: return empty array
        return [];
    }
}

/**
 * Kate Service - Manages Kate documents and native integration
 */
export class KateService {
    private documents: Map<string, KateDocument> = new Map();
    private nextDocId = 1;

    constructor() {
        console.log('[KateService] Initializing Kate service...');
        console.log('[KateService] Native module available:', isNativeAvailable);
        
        if (isNativeAvailable && kateNative) {
            console.log('[KateService] Kate status:', kateNative.getStatus());
        }
    }

    /**
     * Check if native Kate is available
     */
    isKateAvailable(): boolean {
        return isNativeAvailable;
    }

    /**
     * Get Kate status
     */
    getStatus() {
        if (isNativeAvailable && kateNative) {
            return kateNative.getStatus();
        }
        return {
            available: false,
            qtRunning: false,
            version: 'unavailable'
        };
    }

    /**
     * Create a new document
     */
    createDocument(filePath: string, language: string, content: string = ''): string {
        const documentId = `doc-${this.nextDocId++}`;
        const doc = new KateDocument(documentId, filePath, language, content);
        this.documents.set(documentId, doc);
        
        console.log(`[KateService] Created document ${documentId}: ${filePath}`);
        return documentId;
    }

    /**
     * Open an existing document
     */
    async openDocument(documentId: string, filePath: string, language: string): Promise<boolean> {
        const doc = new KateDocument(documentId, filePath, language);
        
        // Try to open from file if native is available
        if (isNativeAvailable) {
            const success = await doc.openUrl(filePath);
            if (success) {
                this.documents.set(documentId, doc);
                console.log(`[KateService] Opened document ${documentId}: ${filePath}`);
                return true;
            }
        }

        // Fallback: just create empty document
        this.documents.set(documentId, doc);
        console.log(`[KateService] Created empty document ${documentId}: ${filePath}`);
        return true;
    }

    /**
     * Close a document
     */
    closeDocument(documentId: string): boolean {
        const doc = this.documents.get(documentId);
        if (doc) {
            this.documents.delete(documentId);
            console.log(`[KateService] Closed document ${documentId}`);
            return true;
        }
        return false;
    }

    /**
     * Get document
     */
    getDocument(documentId: string): KateDocument | undefined {
        return this.documents.get(documentId);
    }

    /**
     * Apply buffer update
     */
    applyBufferUpdate(update: BufferUpdate): void {
        const doc = this.documents.get(update.documentId);
        if (!doc) {
            console.error(`[KateService] Document not found: ${update.documentId}`);
            return;
        }

        console.log(`[KateService] Applying ${update.changes.length} changes to ${update.documentId}`);
        
        for (const change of update.changes) {
            doc.applyChange(change);
        }
    }

    /**
     * Get document text
     */
    getDocumentText(documentId: string): string | null {
        const doc = this.documents.get(documentId);
        return doc ? doc.getText() : null;
    }

    /**
     * Get document metadata
     */
    getDocumentMetadata(documentId: string): DocumentMetadata | null {
        const doc = this.documents.get(documentId);
        return doc ? doc.getMetadata() : null;
    }

    /**
     * Save document
     */
    async saveDocument(documentId: string): Promise<boolean> {
        const doc = this.documents.get(documentId);
        if (!doc) {
            return false;
        }

        return await doc.save();
    }

    /**
     * Get all open documents
     */
    getAllDocuments(): DocumentMetadata[] {
        return Array.from(this.documents.values()).map(doc => doc.getMetadata());
    }

    /**
     * Get syntax tokens (placeholder for now)
     */
    getSyntaxTokens(documentId: string, lineStart: number, lineEnd: number): SyntaxToken[] {
        const doc = this.documents.get(documentId);
        if (!doc) {
            console.warn(`[KateService] Document ${documentId} not found`);
            return [];
        }
        
        return doc.getSyntaxTokens(lineStart, lineEnd);
    }

    /**
     * Get folding regions (Phase 7)
     */
    getFoldingRegions(documentId: string): any[] {
        const doc = this.documents.get(documentId);
        if (!doc) {
            console.warn(`[KateService] Document ${documentId} not found`);
            return [];
        }
        
        return doc.getFoldingRegions();
    }
}

// Export singleton instance
export const kateService = new KateService();
