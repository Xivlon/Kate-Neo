# Kate ↔ Node.js Communication Protocol Specification

## Overview

This document defines the communication protocol between the Node.js backend (with native KTextEditor bindings) and the web-based frontend. The protocol enables real-time document editing, syntax highlighting, and advanced editor features.

## Protocol Architecture

### Communication Layers

```
┌─────────────────────────────────────────┐
│     Web Frontend (React/TypeScript)     │
│  ┌───────────────────────────────────┐ │
│  │   Editor UI (Monaco/Custom)       │ │
│  │   - Text rendering                │ │
│  │   - User input handling           │ │
│  │   - Syntax highlighting display   │ │
│  └───────────────┬───────────────────┘ │
└──────────────────┼──────────────────────┘
                   │
            WebSocket (JSON)
                   │
┌──────────────────▼──────────────────────┐
│   Node.js Backend (Express + WS)        │
│  ┌───────────────────────────────────┐ │
│  │   Kate Bridge Service             │ │
│  │   - Message routing               │ │
│  │   - State management              │ │
│  │   - Event translation             │ │
│  └───────────────┬───────────────────┘ │
└──────────────────┼──────────────────────┘
                   │
          Native Binding (N-API)
                   │
┌──────────────────▼──────────────────────┐
│   KTextEditor (C++/Qt)                  │
│  ┌───────────────────────────────────┐ │
│  │   Document Buffer                 │ │
│  │   Syntax Engine                   │ │
│  │   Indentation Engine              │ │
│  │   Search/Replace                  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Transport Protocol

### WebSocket Connection

**Endpoint**: `ws://localhost:5000/kate-bridge`

**Protocol**: JSON-based message passing

**Connection Lifecycle**:
1. Client connects via WebSocket
2. Server sends `connection.ack` message
3. Client sends `connection.init` with client metadata
4. Bidirectional message exchange begins
5. Client/server can close connection anytime

### Message Format

#### Base Message Structure

```typescript
interface Message<T = any> {
  type: MessageType;           // Message type identifier
  payload: T;                  // Message-specific data
  requestId?: string;          // Optional correlation ID
  timestamp?: number;          // Message timestamp (ms since epoch)
  priority?: 'high' | 'normal' | 'low';  // Optional priority
}
```

#### Message Types

```typescript
type MessageType =
  // Connection lifecycle
  | 'connection.init'
  | 'connection.ack'
  | 'connection.ping'
  | 'connection.pong'
  | 'connection.error'
  
  // Document lifecycle
  | 'document.create'
  | 'document.created'
  | 'document.open'
  | 'document.opened'
  | 'document.close'
  | 'document.closed'
  | 'document.save'
  | 'document.saved'
  
  // Buffer operations
  | 'buffer.update'
  | 'buffer.updated'
  | 'buffer.replace'
  | 'buffer.insert'
  | 'buffer.remove'
  | 'buffer.clear'
  
  // Syntax highlighting
  | 'syntax.request'
  | 'syntax.response'
  | 'syntax.mode.set'
  | 'syntax.mode.changed'
  | 'syntax.invalidate'
  
  // Code folding
  | 'fold.request'
  | 'fold.response'
  | 'fold.toggle'
  | 'fold.expand'
  | 'fold.collapse'
  | 'fold.regions.changed'
  
  // Indentation
  | 'indent.request'
  | 'indent.response'
  | 'indent.auto'
  | 'indent.config.changed'
  
  // Search and replace
  | 'search.find'
  | 'search.results'
  | 'search.replace'
  | 'search.replace.all'
  
  // Cursor and selection
  | 'cursor.move'
  | 'cursor.moved'
  | 'selection.set'
  | 'selection.changed'
  
  // Undo/redo
  | 'undo.request'
  | 'undo.done'
  | 'redo.request'
  | 'redo.done'
  | 'history.changed'
  
  // Status and diagnostics
  | 'status.request'
  | 'status.response'
  | 'error';
```

## Connection Management

### 1. Connection Initialization

**Client → Server: connection.init**
```json
{
  "type": "connection.init",
  "payload": {
    "clientId": "web-client-abc123",
    "clientVersion": "1.0.0",
    "capabilities": {
      "incrementalSync": true,
      "syntaxHighlighting": true,
      "codeFolding": true,
      "multiCursor": false
    }
  },
  "timestamp": 1234567890000
}
```

**Server → Client: connection.ack**
```json
{
  "type": "connection.ack",
  "payload": {
    "serverId": "kate-bridge-xyz789",
    "serverVersion": "1.0.0",
    "kateVersion": "5.108.0",
    "capabilities": {
      "documentCount": 100,
      "syntaxModes": ["JavaScript", "TypeScript", "Python", "..."],
      "maxDocumentSize": 10485760
    }
  },
  "timestamp": 1234567890001
}
```

### 2. Heartbeat/Keepalive

**Every 30 seconds**:

**Client → Server: connection.ping**
```json
{
  "type": "connection.ping",
  "timestamp": 1234567920000
}
```

**Server → Client: connection.pong**
```json
{
  "type": "connection.pong",
  "timestamp": 1234567920001
}
```

## Document Operations

### 1. Open Document

**Client → Server: document.open**
```json
{
  "type": "document.open",
  "payload": {
    "documentId": "doc-12345",
    "filePath": "/path/to/file.js",
    "content": "const x = 1;\n",
    "language": "JavaScript",
    "encoding": "UTF-8",
    "lineEnding": "LF"
  },
  "requestId": "req-001",
  "timestamp": 1234567890100
}
```

**Server → Client: document.opened**
```json
{
  "type": "document.opened",
  "payload": {
    "documentId": "doc-12345",
    "success": true,
    "metadata": {
      "language": "JavaScript",
      "lineCount": 1,
      "version": 0,
      "isDirty": false,
      "size": 13
    }
  },
  "requestId": "req-001",
  "timestamp": 1234567890150
}
```

### 2. Close Document

**Client → Server: document.close**
```json
{
  "type": "document.close",
  "payload": {
    "documentId": "doc-12345",
    "save": true
  },
  "requestId": "req-002"
}
```

**Server → Client: document.closed**
```json
{
  "type": "document.closed",
  "payload": {
    "documentId": "doc-12345",
    "success": true,
    "saved": true
  },
  "requestId": "req-002"
}
```

### 3. Save Document

**Client → Server: document.save**
```json
{
  "type": "document.save",
  "payload": {
    "documentId": "doc-12345",
    "filePath": "/path/to/file.js"
  },
  "requestId": "req-003"
}
```

**Server → Client: document.saved**
```json
{
  "type": "document.saved",
  "payload": {
    "documentId": "doc-12345",
    "success": true,
    "filePath": "/path/to/file.js",
    "size": 1024,
    "timestamp": 1234567890200
  },
  "requestId": "req-003"
}
```

## Buffer Synchronization

### Incremental Updates (Recommended)

**Client → Server: buffer.update**
```json
{
  "type": "buffer.update",
  "payload": {
    "documentId": "doc-12345",
    "version": 5,
    "changes": [
      {
        "range": {
          "start": { "line": 2, "column": 10 },
          "end": { "line": 2, "column": 10 }
        },
        "text": "new ",
        "changeId": "change-001"
      }
    ]
  },
  "timestamp": 1234567890250
}
```

**Server → Client: buffer.updated**
```json
{
  "type": "buffer.updated",
  "payload": {
    "documentId": "doc-12345",
    "version": 6,
    "success": true,
    "changes": [
      {
        "changeId": "change-001",
        "applied": true
      }
    ]
  },
  "timestamp": 1234567890260
}
```

### Full Text Replacement

**Client → Server: buffer.replace**
```json
{
  "type": "buffer.replace",
  "payload": {
    "documentId": "doc-12345",
    "text": "const x = 1;\nconst y = 2;\n",
    "version": 1
  },
  "requestId": "req-004"
}
```

### Insert Text

**Client → Server: buffer.insert**
```json
{
  "type": "buffer.insert",
  "payload": {
    "documentId": "doc-12345",
    "position": { "line": 1, "column": 0 },
    "text": "// Comment\n"
  }
}
```

### Remove Text

**Client → Server: buffer.remove**
```json
{
  "type": "buffer.remove",
  "payload": {
    "documentId": "doc-12345",
    "range": {
      "start": { "line": 0, "column": 0 },
      "end": { "line": 0, "column": 12 }
    }
  }
}
```

## Syntax Highlighting

### Request Highlighting

**Client → Server: syntax.request**
```json
{
  "type": "syntax.request",
  "payload": {
    "documentId": "doc-12345",
    "lineStart": 0,
    "lineEnd": 100
  },
  "requestId": "req-005"
}
```

**Server → Client: syntax.response**
```json
{
  "type": "syntax.response",
  "payload": {
    "documentId": "doc-12345",
    "lineStart": 0,
    "lineEnd": 100,
    "tokens": [
      {
        "line": 0,
        "startColumn": 0,
        "endColumn": 5,
        "tokenType": "keyword",
        "scopes": ["source.js", "keyword.control.js"]
      },
      {
        "line": 0,
        "startColumn": 6,
        "endColumn": 7,
        "tokenType": "variable",
        "scopes": ["source.js", "variable.other.js"]
      }
    ]
  },
  "requestId": "req-005"
}
```

### Set Syntax Mode

**Client → Server: syntax.mode.set**
```json
{
  "type": "syntax.mode.set",
  "payload": {
    "documentId": "doc-12345",
    "mode": "TypeScript"
  }
}
```

**Server → Client: syntax.mode.changed**
```json
{
  "type": "syntax.mode.changed",
  "payload": {
    "documentId": "doc-12345",
    "mode": "TypeScript",
    "success": true
  }
}
```

### Invalidate Highlighting (after changes)

**Server → Client: syntax.invalidate**
```json
{
  "type": "syntax.invalidate",
  "payload": {
    "documentId": "doc-12345",
    "lineStart": 5,
    "lineEnd": 10
  }
}
```

## Code Folding

### Request Folding Regions

**Client → Server: fold.request**
```json
{
  "type": "fold.request",
  "payload": {
    "documentId": "doc-12345"
  },
  "requestId": "req-006"
}
```

**Server → Client: fold.response**
```json
{
  "type": "fold.response",
  "payload": {
    "documentId": "doc-12345",
    "regions": [
      {
        "startLine": 5,
        "endLine": 20,
        "kind": "region",
        "isFolded": false
      },
      {
        "startLine": 10,
        "endLine": 15,
        "kind": "comment",
        "isFolded": false
      }
    ]
  },
  "requestId": "req-006"
}
```

### Toggle Fold

**Client → Server: fold.toggle**
```json
{
  "type": "fold.toggle",
  "payload": {
    "documentId": "doc-12345",
    "line": 5
  }
}
```

**Server → Client: fold.regions.changed**
```json
{
  "type": "fold.regions.changed",
  "payload": {
    "documentId": "doc-12345",
    "regions": [
      {
        "startLine": 5,
        "endLine": 20,
        "kind": "region",
        "isFolded": true
      }
    ]
  }
}
```

## Search and Replace

### Find

**Client → Server: search.find**
```json
{
  "type": "search.find",
  "payload": {
    "documentId": "doc-12345",
    "query": "function",
    "options": {
      "caseSensitive": false,
      "wholeWord": true,
      "useRegex": false
    }
  },
  "requestId": "req-007"
}
```

**Server → Client: search.results**
```json
{
  "type": "search.results",
  "payload": {
    "documentId": "doc-12345",
    "query": "function",
    "results": [
      {
        "range": {
          "start": { "line": 3, "column": 0 },
          "end": { "line": 3, "column": 8 }
        },
        "text": "function",
        "lineContent": "function myFunc() {"
      },
      {
        "range": {
          "start": { "line": 10, "column": 2 },
          "end": { "line": 10, "column": 10 }
        },
        "text": "function",
        "lineContent": "  function helper() {"
      }
    ],
    "totalCount": 2
  },
  "requestId": "req-007"
}
```

### Replace

**Client → Server: search.replace**
```json
{
  "type": "search.replace",
  "payload": {
    "documentId": "doc-12345",
    "range": {
      "start": { "line": 3, "column": 0 },
      "end": { "line": 3, "column": 8 }
    },
    "replaceText": "const"
  }
}
```

### Replace All

**Client → Server: search.replace.all**
```json
{
  "type": "search.replace.all",
  "payload": {
    "documentId": "doc-12345",
    "query": "function",
    "replaceText": "const",
    "options": {
      "caseSensitive": false,
      "wholeWord": true,
      "useRegex": false
    }
  },
  "requestId": "req-008"
}
```

## Cursor and Selection

### Move Cursor

**Client → Server: cursor.move**
```json
{
  "type": "cursor.move",
  "payload": {
    "documentId": "doc-12345",
    "position": { "line": 5, "column": 10 }
  }
}
```

**Server → Client: cursor.moved**
```json
{
  "type": "cursor.moved",
  "payload": {
    "documentId": "doc-12345",
    "position": { "line": 5, "column": 10 }
  }
}
```

### Set Selection

**Client → Server: selection.set**
```json
{
  "type": "selection.set",
  "payload": {
    "documentId": "doc-12345",
    "range": {
      "start": { "line": 5, "column": 0 },
      "end": { "line": 5, "column": 20 }
    }
  }
}
```

## Undo/Redo

### Undo

**Client → Server: undo.request**
```json
{
  "type": "undo.request",
  "payload": {
    "documentId": "doc-12345"
  },
  "requestId": "req-009"
}
```

**Server → Client: undo.done**
```json
{
  "type": "undo.done",
  "payload": {
    "documentId": "doc-12345",
    "success": true,
    "canUndo": true,
    "canRedo": true
  },
  "requestId": "req-009"
}
```

### Redo

**Client → Server: redo.request**
```json
{
  "type": "redo.request",
  "payload": {
    "documentId": "doc-12345"
  },
  "requestId": "req-010"
}
```

## Error Handling

### Error Message

**Server → Client: error**
```json
{
  "type": "error",
  "payload": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document with ID doc-12345 not found",
    "details": {
      "documentId": "doc-12345"
    }
  },
  "requestId": "req-001",
  "timestamp": 1234567890999
}
```

### Error Codes

```typescript
enum ErrorCode {
  // Connection errors
  CONNECTION_FAILED = "CONNECTION_FAILED",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  
  // Document errors
  DOCUMENT_NOT_FOUND = "DOCUMENT_NOT_FOUND",
  DOCUMENT_ALREADY_OPEN = "DOCUMENT_ALREADY_OPEN",
  DOCUMENT_READ_ONLY = "DOCUMENT_READ_ONLY",
  
  // Buffer errors
  INVALID_RANGE = "INVALID_RANGE",
  VERSION_MISMATCH = "VERSION_MISMATCH",
  BUFFER_LOCKED = "BUFFER_LOCKED",
  
  // Syntax errors
  SYNTAX_MODE_NOT_FOUND = "SYNTAX_MODE_NOT_FOUND",
  
  // General errors
  INVALID_REQUEST = "INVALID_REQUEST",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TIMEOUT = "TIMEOUT"
}
```

## Performance Optimization

### Batching

**Multiple operations in single message**:
```json
{
  "type": "buffer.update",
  "payload": {
    "documentId": "doc-12345",
    "version": 10,
    "changes": [
      { "range": {...}, "text": "..." },
      { "range": {...}, "text": "..." },
      { "range": {...}, "text": "..." }
    ]
  }
}
```

### Throttling

- **Syntax requests**: Max 1 per 100ms per document
- **Buffer updates**: Batched every 50ms
- **Cursor moves**: Throttled to 10 per second

### Compression (Future)

```json
{
  "type": "buffer.update",
  "payload": {
    "compressed": true,
    "encoding": "gzip",
    "data": "H4sIAAAAAAAA..."
  }
}
```

## Security Considerations

### Authentication (Future)

```json
{
  "type": "connection.init",
  "payload": {
    "token": "jwt-token-here",
    "clientId": "..."
  }
}
```

### Input Validation

- All ranges validated for bounds
- Text size limits enforced
- Document ID validation
- Path traversal prevention

### Rate Limiting

- Max 100 messages per second per connection
- Max 10 concurrent documents per connection
- Max document size: 10MB

## Implementation Guidelines

### Client-Side (TypeScript)

```typescript
class KateBridgeClient {
  private ws: WebSocket;
  private requestMap = new Map<string, (response: any) => void>();
  
  async openDocument(documentId: string, content: string): Promise<void> {
    return this.sendRequest('document.open', {
      documentId,
      content,
      language: 'JavaScript'
    });
  }
  
  private sendRequest(type: string, payload: any): Promise<any> {
    return new Promise((resolve) => {
      const requestId = generateId();
      this.requestMap.set(requestId, resolve);
      
      this.ws.send(JSON.stringify({
        type,
        payload,
        requestId,
        timestamp: Date.now()
      }));
    });
  }
}
```

### Server-Side (TypeScript + Native)

```typescript
class KateBridgeServer {
  private documents = new Map<string, NativeDocument>();
  
  handleMessage(ws: WebSocket, message: Message): void {
    switch (message.type) {
      case 'document.open':
        this.handleDocumentOpen(ws, message);
        break;
      case 'buffer.update':
        this.handleBufferUpdate(ws, message);
        break;
      // ...
    }
  }
  
  private handleDocumentOpen(ws: WebSocket, message: Message): void {
    const { documentId, content } = message.payload;
    
    // Call native binding
    const doc = nativeKate.createDocument();
    doc.setText(content);
    
    this.documents.set(documentId, doc);
    
    this.send(ws, {
      type: 'document.opened',
      payload: { documentId, success: true },
      requestId: message.requestId
    });
  }
}
```

## Next Steps

1. Implement WebSocket server with message routing
2. Define TypeScript types for all messages
3. Implement client-side protocol handler
4. Add request/response correlation
5. Implement error handling
6. Add performance monitoring
7. Test with multiple clients
8. Add compression for large payloads

## References

- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [LSP Specification](https://microsoft.github.io/language-server-protocol/) (for inspiration)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
