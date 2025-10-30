/**
 * Kate Native Module - JavaScript API
 * 
 * Provides a clean JavaScript interface to the native KTextEditor bindings.
 * This module gracefully handles cases where the native module is not available.
 */

let nativeModule = null;
let kateAvailable = false;

try {
    // Try to load the native module
    nativeModule = require('./build/Release/kate_native.node');
    kateAvailable = nativeModule.isKateAvailable || false;
} catch (error) {
    // Native module not available - provide fallback
    console.warn('[Kate Native] Native module not available:', error.message);
    console.warn('[Kate Native] Running in fallback mode without KTextEditor support');
    
    // Provide mock implementations
    nativeModule = {
        isKateAvailable: false,
        qtRunning: () => false,
        KateDocument: class MockDocument {
            constructor() {
                console.warn('[Kate Native] Using mock document (KTextEditor not available)');
            }
            getText() { return ''; }
            setText(text) {}
            line(num) { return ''; }
            insertText(line, col, text) {}
            removeText(startLine, startCol, endLine, endCol) {}
            lineCount() { return 0; }
            length() { return 0; }
            isModified() { return false; }
            mode() { return ''; }
            setMode(mode) {}
            modes() { return []; }
            openUrl(url) { return false; }
            saveUrl() { return false; }
            url() { return ''; }
            undo() {}
            redo() {}
            getSyntaxTokens(lineStart, lineEnd) { return []; }
            getFoldingRegions() { return []; }
        },
        KateEditor: class MockEditor {
            constructor() {
                console.warn('[Kate Native] Using mock editor (KTextEditor not available)');
            }
            version() { return 'mock'; }
            applicationName() { return 'Mock Kate Editor'; }
            availableModes() { return []; }
        }
    };
}

/**
 * Check if KTextEditor is available
 */
function isKateAvailable() {
    return kateAvailable;
}

/**
 * Check if Qt event loop is running
 */
function isQtRunning() {
    return nativeModule && nativeModule.qtRunning ? nativeModule.qtRunning() : false;
}

/**
 * Create a new Kate document
 */
function createDocument() {
    if (!nativeModule || !nativeModule.KateDocument) {
        throw new Error('Kate native module not available');
    }
    return new nativeModule.KateDocument();
}

/**
 * Get Kate editor instance
 */
function getEditor() {
    if (!nativeModule || !nativeModule.KateEditor) {
        throw new Error('Kate native module not available');
    }
    return new nativeModule.KateEditor();
}

/**
 * Get module status information
 */
function getStatus() {
    return {
        available: kateAvailable,
        qtRunning: isQtRunning(),
        version: kateAvailable ? getEditor().version() : 'unavailable'
    };
}

// Export public API
module.exports = {
    // Status
    isKateAvailable,
    isQtRunning,
    getStatus,
    
    // Factory functions
    createDocument,
    getEditor,
    
    // Direct access to native classes (for advanced usage)
    KateDocument: nativeModule.KateDocument,
    KateEditor: nativeModule.KateEditor,
};
