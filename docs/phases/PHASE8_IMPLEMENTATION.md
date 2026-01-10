# Phase 8: Core Features Completion - Implementation Guide

## Overview

Phase 8 focuses on completing the core IDE features by implementing advanced editing capabilities and Language Server Protocol (LSP) integration. This builds upon the foundation established in Phases 6 and 7, bringing Kate Neo to feature parity with modern IDEs.

## Implementation Date

October 30, 2025

## Objectives

### 1. Advanced Editing Features
- **Bidirectional buffer synchronization**: Real-time sync between Kate engine and frontend
- **Smart indentation from Kate**: Leverage Kate's intelligent indentation engine
- **Advanced search and replace**: Powerful search with regex, case-sensitivity, whole word
- **Multi-cursor support**: Edit multiple locations simultaneously
- **Kate session management**: Save and restore editing sessions

### 2. LSP Integration
- **Language Server Protocol support**: Full LSP client implementation
- **Code completion**: Intelligent code suggestions from language servers
- **Go to definition**: Navigate to symbol definitions
- **Find references**: Find all references to a symbol
- **Diagnostics and errors**: Real-time error checking and warnings

## Architecture

```
┌─────────────────────────────────────────┐
│   React Frontend (Monaco Editor)        │
│  ┌─────────────────────────────────┐   │
│  │   LSP UI Components             │   │
│  │   - Completion widgets          │   │
│  │   - Diagnostics panel           │   │
│  │   - Multi-cursor UI             │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ WebSocket/HTTP
┌─────────────────▼──────────────────────┐
│   Express Backend (Node.js)             │
│  ┌─────────────────────────────────┐   │
│  │   LSP Service                   │   │  NEW
│  │   - Server lifecycle mgmt       │   │
│  │   - JSON-RPC communication      │   │
│  │   - Capability negotiation      │   │
│  └──────────────┬──────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Kate Service (Enhanced)       │   │  UPDATED
│  │   - Buffer synchronization      │   │
│  │   - Search/replace API          │   │
│  │   - Indentation API             │   │
│  │   - Session management          │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ N-API
┌─────────────────▼──────────────────────┐
│   @kate-neo/native (Enhanced)           │  UPDATED
│  ┌─────────────────────────────────┐   │
│  │  Search/Replace methods         │   │  NEW
│  │  Indentation methods            │   │  NEW
│  │  Session save/restore           │   │  NEW
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ Qt/C++ API
┌─────────────────▼──────────────────────┐
│   KTextEditor Framework (KF5)           │
│   - Search/Replace engine               │
│   - Smart indentation                   │
│   - Session management                  │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Part 1: Advanced Editing Features

#### 1.1 Native Module Enhancements

**File**: `packages/kate-native/src/document_wrapper.h`

Add method declarations:
```cpp
// Search and replace
Napi::Value Search(const Napi::CallbackInfo& info);
Napi::Value SearchAll(const Napi::CallbackInfo& info);
Napi::Value Replace(const Napi::CallbackInfo& info);
Napi::Value ReplaceAll(const Napi::CallbackInfo& info);

// Indentation
Napi::Value GetIndentation(const Napi::CallbackInfo& info);
void SetIndentation(const Napi::CallbackInfo& info);
void AutoIndent(const Napi::CallbackInfo& info);

// Session management
Napi::Value SaveSession(const Napi::CallbackInfo& info);
void RestoreSession(const Napi::CallbackInfo& info);
```

**File**: `packages/kate-native/src/document_wrapper.cpp`

Implement methods using KTextEditor API:
- `search()` - KTextEditor::Document::searchText()
- `replace()` - KTextEditor::Document::replaceText()
- Indentation - KTextEditor::Document::indent()
- Session - KTextEditor::Document::session management

#### 1.2 Backend Service Updates

**File**: `server/kate-service.ts`

Extend `KateDocument` class:
```typescript
class KateDocument {
  // Existing methods...
  
  // Search and replace
  async search(query: string, options: SearchOptions): Promise<SearchResult[]>
  async replace(query: string, replacement: string, options: ReplaceOptions): Promise<number>
  
  // Indentation
  async getIndentation(line: number): Promise<number>
  async setIndentation(line: number, spaces: number): Promise<void>
  async autoIndent(startLine: number, endLine: number): Promise<void>
  
  // Session
  async saveSession(): Promise<SessionData>
  async restoreSession(data: SessionData): Promise<void>
}
```

#### 1.3 Buffer Synchronization

**File**: `server/kate-bridge.ts`

Implement bidirectional sync:
```typescript
interface BufferUpdate {
  documentId: string;
  changes: TextChange[];
  version: number;
}

// Kate → Frontend
function handleKateChange(documentId: string, change: TextChange) {
  // Send update via WebSocket
  broadcastToClients({
    type: 'buffer.update',
    payload: { documentId, change }
  });
}

// Frontend → Kate
function handleBufferUpdate(update: BufferUpdate) {
  // Apply changes to Kate document
  kateService.applyChanges(update.documentId, update.changes);
}
```

#### 1.4 Frontend Integration

**File**: `client/src/hooks/useKateBridge.ts`

Add methods:
```typescript
const useKateBridge = () => {
  // Existing methods...
  
  const search = async (query: string, options: SearchOptions) => { ... };
  const replace = async (query: string, replacement: string) => { ... };
  const autoIndent = async (startLine: number, endLine: number) => { ... };
  
  return { ..., search, replace, autoIndent };
};
```

**File**: `client/src/components/SearchPanel.tsx` (NEW)

Create UI for search/replace functionality.

### Part 2: LSP Integration

#### 2.1 LSP Service Backend

**File**: `server/lsp-service.ts` (NEW)

Create comprehensive LSP service:
```typescript
import * as lsp from 'vscode-languageserver-protocol';
import { StreamMessageReader, StreamMessageWriter } from 'vscode-jsonrpc/node';

export class LSPService {
  private servers: Map<string, LSPServerConnection> = new Map();
  
  async initializeServer(languageId: string, config: LSPServerConfig): Promise<void> {
    // 1. Spawn language server process
    // 2. Establish JSON-RPC connection
    // 3. Send initialize request
    // 4. Store capabilities
  }
  
  async provideCompletions(uri: string, position: lsp.Position): Promise<lsp.CompletionItem[]> {
    // Send completion request to appropriate server
  }
  
  async gotoDefinition(uri: string, position: lsp.Position): Promise<lsp.Location | null> {
    // Send definition request
  }
  
  async findReferences(uri: string, position: lsp.Position): Promise<lsp.Location[]> {
    // Send references request
  }
  
  async provideDiagnostics(uri: string): Promise<lsp.Diagnostic[]> {
    // Get diagnostics from server
  }
}
```

#### 2.2 LSP Server Configurations

**File**: `server/lsp-configs.ts` (NEW)

Define language server configurations:
```typescript
export const LSP_CONFIGS: Record<string, LSPServerConfig> = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact']
  },
  python: {
    command: 'pylsp',
    args: [],
    languages: ['python']
  },
  rust: {
    command: 'rust-analyzer',
    args: [],
    languages: ['rust']
  },
  // Add more language servers...
};
```

#### 2.3 Frontend LSP Manager Updates

**File**: `client/src/lib/lsp/LSPManager.ts`

Complete the implementation:
```typescript
export class LSPManager {
  private ws: WebSocket | null = null;
  
  async connect(): Promise<void> {
    // Connect to backend LSP service via WebSocket
  }
  
  async provideCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
    // Request completions from backend
    return this.sendRequest('completion', { uri, position });
  }
  
  async gotoDefinition(uri: string, position: Position): Promise<Location | null> {
    // Request definition from backend
    return this.sendRequest('definition', { uri, position });
  }
  
  async findReferences(uri: string, position: Position): Promise<Location[]> {
    // Request references from backend
    return this.sendRequest('references', { uri, position });
  }
  
  private async sendRequest(method: string, params: any): Promise<any> {
    // Send LSP request via WebSocket
  }
}
```

#### 2.4 Monaco Editor LSP Integration

**File**: `client/src/components/CodeEditor.tsx`

Integrate LSP with Monaco:
```typescript
import { lspManager } from '@/lib/lsp/LSPManager';
import * as monaco from 'monaco-editor';

// Register completion provider
monaco.languages.registerCompletionItemProvider('typescript', {
  async provideCompletionItems(model, position) {
    const uri = model.uri.toString();
    const items = await lspManager.provideCompletions(uri, {
      line: position.lineNumber - 1,
      character: position.column - 1
    });
    return { suggestions: items };
  }
});

// Register definition provider
monaco.languages.registerDefinitionProvider('typescript', {
  async provideDefinition(model, position) {
    const uri = model.uri.toString();
    const location = await lspManager.gotoDefinition(uri, {
      line: position.lineNumber - 1,
      character: position.column - 1
    });
    return location ? [location] : [];
  }
});

// Register reference provider
monaco.languages.registerReferenceProvider('typescript', {
  async provideReferences(model, position) {
    const uri = model.uri.toString();
    return await lspManager.findReferences(uri, {
      line: position.lineNumber - 1,
      character: position.column - 1
    });
  }
});
```

#### 2.5 Diagnostics Panel

**File**: `client/src/components/DiagnosticsPanel.tsx` (NEW)

Create UI for displaying diagnostics:
```typescript
export const DiagnosticsPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  
  useEffect(() => {
    lspManager.onDiagnostics((diags) => {
      setDiagnostics(diags);
    });
  }, []);
  
  return (
    <div className="diagnostics-panel">
      {diagnostics.map((diag, i) => (
        <DiagnosticItem key={i} diagnostic={diag} />
      ))}
    </div>
  );
};
```

### Part 3: Multi-Cursor Support

#### 3.1 Native Module Multi-Cursor API

**File**: `packages/kate-native/src/document_wrapper.h`

Add multi-cursor methods:
```cpp
// Multi-cursor operations
Napi::Value GetCursors(const Napi::CallbackInfo& info);
void SetCursors(const Napi::CallbackInfo& info);
void InsertTextAtCursors(const Napi::CallbackInfo& info);
```

#### 3.2 Frontend Multi-Cursor Support

**File**: `client/src/components/CodeEditor.tsx`

Monaco already supports multi-cursor - integrate with Kate backend for sync.

### Part 4: Session Management

#### 4.1 Session Storage

**File**: `server/session-manager.ts` (NEW)

```typescript
export class SessionManager {
  async saveSession(sessionId: string): Promise<SessionData> {
    // Save all open documents, cursor positions, etc.
  }
  
  async restoreSession(sessionData: SessionData): Promise<void> {
    // Restore documents and state
  }
  
  async listSessions(): Promise<SessionInfo[]> {
    // List available sessions
  }
}
```

#### 4.2 Session UI

**File**: `client/src/components/SessionPanel.tsx` (NEW)

UI for managing sessions.

## Dependencies

### Backend Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "vscode-languageserver-protocol": "^3.17.5",
    "vscode-jsonrpc": "^8.2.0",
    "vscode-languageserver-types": "^3.17.5"
  }
}
```

### Language Servers (Optional, per language)

Users can install language servers separately:
- TypeScript: `npm install -g typescript-language-server`
- Python: `pip install python-lsp-server`
- Rust: Install via rustup
- Go: `go install golang.org/x/tools/gopls@latest`

## Testing Strategy

### Unit Tests

**File**: `packages/kate-native/test/search.test.js`
```javascript
describe('Search and Replace', () => {
  it('should find text in document', async () => {
    const doc = createDocument();
    doc.setText('Hello world\nHello again');
    const results = doc.search('Hello', {});
    expect(results.length).toBe(2);
  });
});
```

### Integration Tests

**File**: `server/__tests__/lsp-service.test.ts`
```typescript
describe('LSP Service', () => {
  it('should initialize TypeScript server', async () => {
    const lsp = new LSPService();
    await lsp.initializeServer('typescript', LSP_CONFIGS.typescript);
    expect(lsp.isServerRunning('typescript')).toBe(true);
  });
});
```

### E2E Tests

**File**: `tests/e2e/lsp.test.ts`
```typescript
test('should provide code completions', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="editor"]');
  await page.keyboard.type('console.');
  await page.waitForSelector('.monaco-list-row');
  const suggestions = await page.$$('.monaco-list-row');
  expect(suggestions.length).toBeGreaterThan(0);
});
```

## Performance Considerations

### Buffer Synchronization
- Use delta-based updates (send only changes, not full text)
- Batch updates to reduce WebSocket traffic
- Throttle rapid changes (e.g., during typing)

### LSP Communication
- Cache completion results for 500ms
- Debounce diagnostics requests (300ms)
- Use streaming for large symbol lists
- Lazy-load language servers (only when needed)

### Multi-Cursor
- Limit to 100 simultaneous cursors
- Batch operations for performance

## Security Considerations

### LSP Server Execution
- Validate server paths (no arbitrary command execution)
- Run servers with restricted permissions
- Timeout requests (5s for completion, 10s for definitions)
- Validate all LSP responses

### Session Data
- Encrypt sensitive session data
- Validate session files before restoration
- Limit session file size (max 10MB)

## Migration Guide

### For Users

No breaking changes. New features are additive.

To enable LSP:
1. Install desired language servers
2. Configure in Settings → Languages → LSP
3. Restart IDE

### For Developers

New APIs available:
- `kateService.search(query, options)`
- `kateService.replace(query, replacement, options)`
- `lspManager.provideCompletions(uri, position)`
- `sessionManager.saveSession(sessionId)`

## Success Criteria

### Phase 8 Checklist

- [ ] Native module search/replace methods implemented
- [ ] Native module indentation methods implemented
- [ ] Native module session management implemented
- [ ] Backend LSP service created
- [ ] LSP server configurations defined
- [ ] Frontend LSP manager completed
- [ ] Monaco LSP providers registered
- [ ] Diagnostics panel created
- [ ] Multi-cursor support implemented
- [ ] Session management UI created
- [ ] Buffer synchronization working bidirectionally
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security review passed

### Quality Gates

- [ ] TypeScript: Clean compilation
- [ ] Build: Successful
- [ ] Tests: 90%+ coverage for new code
- [ ] Security: 0 vulnerabilities
- [ ] Performance: <100ms completion latency
- [ ] Performance: <50ms buffer sync latency

## Known Limitations

### LSP
- Requires language servers to be installed separately
- Not all language servers support all features
- Performance depends on language server quality

### Search/Replace
- Regex search limited by Kate engine capabilities
- Very large files (>10MB) may be slow

### Multi-Cursor
- Limited to 100 cursors for performance
- Some operations may not support all cursors

## Future Enhancements (Phase 9+)

- **Refactoring**: Rename symbol, extract method, etc.
- **Workspace symbols**: Search across all files
- **Call hierarchy**: View call graph
- **Type hierarchy**: View type relationships
- **Code actions**: Quick fixes, refactorings
- **Signature help**: Parameter hints while typing
- **Document links**: Clickable URLs and paths
- **Folding ranges**: Advanced code folding from LSP
- **Semantic tokens**: Better syntax highlighting via LSP

## Timeline

- **Week 1**: Native module enhancements (search, indentation, session)
- **Week 2**: Backend LSP service implementation
- **Week 3**: Frontend LSP integration with Monaco
- **Week 4**: Testing, documentation, polish
- **Total**: 4 weeks to Phase 8 completion

## Resources

### Documentation
- [LSP Specification](https://microsoft.github.io/language-server-protocol/)
- [KTextEditor API](https://api.kde.org/frameworks/ktexteditor/html/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [vscode-languageserver-protocol](https://www.npmjs.com/package/vscode-languageserver-protocol)

### Language Servers
- [Awesome Language Servers](https://github.com/langserver/awesome-language-servers)
- [Official LSP Implementations](https://microsoft.github.io/language-server-protocol/implementors/servers/)

## Conclusion

Phase 8 represents a major milestone in Kate Neo development, bringing advanced editing features and language intelligence through LSP integration. Upon completion, Kate Neo will offer a complete modern IDE experience with:

- Intelligent code completion
- Real-time error checking
- Advanced search and replace
- Multi-cursor editing
- Session management
- Full Kate engine integration

The foundation established in Phases 6 and 7 makes this implementation straightforward, with clear separation of concerns and well-defined interfaces between components.

---

**Phase 8 Status**: 🚀 **READY TO START**

All prerequisites from Phase 6 and 7 are in place. Implementation can begin immediately.
