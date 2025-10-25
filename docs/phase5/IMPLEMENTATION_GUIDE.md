# Phase 5: Kate Engine Research & Planning - Implementation Guide

## Overview

This document provides implementation guidelines for integrating the KTextEditor framework into Kate Neo IDE based on the comprehensive research conducted in Phase 5.

## Research Artifacts

All research documentation is located in `/docs/phase5/`:

1. **[KTextEditor Architecture](./1-ktexteditor-architecture.md)** - Complete analysis of KTextEditor framework
2. **[Node.js Native Bindings](./2-nodejs-native-bindings.md)** - Native binding options and implementation
3. **[Qt/KDE Requirements](./3-qt-kde-requirements.md)** - Environment setup and dependencies
4. **[Communication Protocol](./4-communication-protocol.md)** - Kate ↔ Node.js protocol specification
5. **[Proof of Concept](./5-proof-of-concept.md)** - Working POC demonstrating feasibility
6. **[Technical Decisions](./6-technical-decisions.md)** - Trade-offs and recommendations

## Key Findings

### <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Feasibility Confirmed

The proof-of-concept successfully demonstrated:
- KTextEditor can be embedded in Node.js via native bindings
- node-addon-api provides clean C++ integration
- Qt can run headless (QCoreApplication) without GUI
- Document operations perform well (<1ms for typical operations)
- Syntax highlighting works with 300+ languages
- Memory management is stable with smart pointers

### Architecture Overview

```
┌─────────────────────────────────────────┐
│     Web Frontend (React/TypeScript)     │
│  - Monaco/Custom editor UI              │
│  - Syntax highlighting display          │
│  - User interaction handling            │
└──────────────┬──────────────────────────┘
               │ WebSocket (JSON Protocol)
┌──────────────▼──────────────────────────┐
│   Node.js Backend (Express)             │
│  - Kate Bridge Service                  │
│  - Message routing                      │
│  - State management                     │
└──────────────┬──────────────────────────┘
               │ N-API Native Binding
┌──────────────▼──────────────────────────┐
│   Native Kate Module (C++)              │
│  - KTextEditor::Document                │
│  - Syntax highlighting engine           │
│  - Indentation/folding                  │
└─────────────────────────────────────────┘
```

## Implementation Roadmap

### Phase 6: Native Binding Implementation (Next)

**Goal**: Complete native binding for KTextEditor

**Tasks**:
1. Set up build environment
   - Install Qt5/Qt6 and KDE Frameworks
   - Configure node-gyp with binding.gyp
   - Set up continuous integration

2. Implement core wrapper classes
   - `KateDocument` class wrapper
   - `KateEditor` singleton wrapper
   - `KateCursor` and `KateRange` helpers

3. Document operations API
   - Text get/set/insert/remove
   - Line operations
   - Undo/redo
   - Save/load

4. Syntax highlighting integration
   - Mode setting
   - Token extraction
   - Theme application

5. Event system
   - Qt signals → JavaScript callbacks
   - Document change events
   - Mode change events

**Deliverables**:
- Native module: `@kate-neo/native`
- API documentation
- Unit tests
- Build scripts

### Phase 7: WebSocket Bridge (Following)

**Goal**: Implement communication layer

**Tasks**:
1. WebSocket server
   - Connection management
   - Message routing
   - Error handling

2. Protocol implementation
   - Message serialization/deserialization
   - Request/response correlation
   - Version negotiation

3. Document synchronization
   - Incremental updates
   - Version tracking
   - Conflict detection

4. Event propagation
   - Native events → WebSocket messages
   - Broadcast to clients

**Deliverables**:
- Kate Bridge service
- Protocol TypeScript types
- Integration tests
- Protocol documentation

### Phase 8: Frontend Integration

**Goal**: Connect web UI to Kate backend

**Tasks**:
1. WebSocket client
   - Connection lifecycle
   - Message handling
   - Reconnection logic

2. Editor synchronization
   - Buffer sync with Kate
   - Cursor tracking
   - Selection handling

3. Syntax highlighting
   - Token application
   - Theme switching
   - Incremental updates

4. UI enhancements
   - Code folding UI
   - Search/replace
   - Status indicators

**Deliverables**:
- Updated React components
- WebSocket client library
- E2E tests
- User documentation

## Development Environment Setup

### Prerequisites

**Operating System**: Linux (Ubuntu 22.04+ recommended)

**Dependencies**:
```bash
# Install Qt5 and KDE Frameworks
sudo apt-get install \
  qt5-default \
  qtbase5-dev \
  extra-cmake-modules \
  libkf5texteditor-dev \
  libkf5syntaxhighlighting-dev

# Install build tools
sudo apt-get install \
  build-essential \
  cmake \
  pkg-config

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install node-gyp
npm install -g node-gyp
```

**Environment Variables**:
```bash
# Add to ~/.bashrc
export QT_QPA_PLATFORM=offscreen
export CMAKE_PREFIX_PATH=/usr/lib/x86_64-linux-gnu/cmake
```

### Verification

```bash
# Check dependencies
pkg-config --exists Qt5Core && echo "✓ Qt5Core"
pkg-config --exists KF5TextEditor && echo "✓ KF5TextEditor"
command -v node-gyp && echo "✓ node-gyp"
```

## Build Configuration

### binding.gyp Template

```python
{
  "targets": [{
    "target_name": "kate_native",
    "sources": [
      "src/addon.cpp",
      "src/document.cpp",
      "src/editor.cpp"
    ],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")",
      "<!@(pkg-config --cflags-only-I Qt5Core Qt5Gui KF5TextEditor | sed 's/-I//g')"
    ],
    "libraries": [
      "<!@(pkg-config --libs Qt5Core Qt5Gui KF5TextEditor)"
    ],
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "cflags": [ "-fPIC", "-std=c++17" ],
    "cflags_cc": [ "-fPIC", "-std=c++17" ],
    "defines": [ 
      "NAPI_CPP_EXCEPTIONS",
      "QT_NO_KEYWORDS"
    ]
  }]
}
```

### package.json

```json
{
  "name": "@kate-neo/native",
  "version": "0.1.0",
  "description": "Native KTextEditor bindings for Node.js",
  "main": "index.js",
  "scripts": {
    "install": "node-gyp rebuild",
    "build": "node-gyp build",
    "clean": "node-gyp clean",
    "test": "node test/index.js"
  },
  "dependencies": {
    "node-addon-api": "^8.0.0"
  },
  "devDependencies": {
    "node-gyp": "^10.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "os": ["linux", "darwin"],
  "cpu": ["x64", "arm64"]
}
```

## Code Structure

### Native Module Structure

```
server/native/
├── binding.gyp
├── package.json
├── index.js                  # JavaScript wrapper
├── src/
│   ├── addon.cpp             # Module entry point
│   ├── editor.h/cpp          # Editor singleton wrapper
│   ├── document.h/cpp        # Document class wrapper
│   ├── cursor.h/cpp          # Cursor/Range helpers
│   ├── events.h/cpp          # Event system
│   └── qt_runner.h/cpp       # Qt event loop
├── test/
│   ├── basic.test.js
│   ├── document.test.js
│   ├── events.test.js
│   └── syntax.test.js
└── examples/
    ├── simple.js
    └── editor.js
```

### Kate Bridge Structure

```
server/
├── kate-bridge.ts            # Main bridge service
├── protocol.ts               # Protocol handler
├── document-manager.ts       # Document lifecycle
├── event-emitter.ts          # Event propagation
└── websocket-server.ts       # WebSocket layer
```

## API Design

### Native Module API

```typescript
// TypeScript definitions
declare module '@kate-neo/native' {
  export class KateDocument {
    constructor();
    getText(): string;
    setText(text: string): void;
    insertText(line: number, column: number, text: string): void;
    removeText(startLine: number, startCol: number, 
               endLine: number, endCol: number): void;
    line(lineNumber: number): string;
    readonly lineCount: number;
    setMode(mode: string): void;
    readonly mode: string;
    save(): boolean;
    readonly isModified: boolean;
    
    // Events
    on(event: 'textChanged', callback: () => void): void;
    on(event: 'modeChanged', callback: (mode: string) => void): void;
  }
  
  export const version: string;
}
```

### JavaScript Wrapper

```javascript
// index.js - High-level JavaScript API
const binding = require('./build/Release/kate_native');

class KateDocument {
  constructor() {
    this._native = new binding.KateDocument();
    this._callbacks = new Map();
  }
  
  getText() {
    return this._native.getText();
  }
  
  setText(text) {
    this._native.setText(text);
  }
  
  on(event, callback) {
    if (!this._callbacks.has(event)) {
      this._callbacks.set(event, []);
    }
    this._callbacks.get(event).push(callback);
    
    // Register with native layer
    this._native.on(event, (...args) => {
      this._callbacks.get(event).forEach(cb => cb(...args));
    });
  }
  
  // ... other methods
}

module.exports = { KateDocument };
```

## Protocol Implementation

### Message Types

```typescript
// Implement all message types from protocol spec
type MessageType = 
  | 'document.open'
  | 'document.opened'
  | 'buffer.update'
  | 'buffer.updated'
  | 'syntax.request'
  | 'syntax.response'
  // ... (see protocol spec for full list)

interface Message<T = any> {
  type: MessageType;
  payload: T;
  requestId?: string;
  timestamp: number;
}
```

### WebSocket Handler

```typescript
// server/websocket-server.ts
class KateWebSocketServer {
  private wss: WebSocketServer;
  private documentManager: DocumentManager;
  
  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.documentManager = new DocumentManager();
    
    this.wss.on('connection', this.handleConnection);
  }
  
  private handleConnection = (ws: WebSocket) => {
    ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());
      await this.handleMessage(ws, message);
    });
  }
  
  private async handleMessage(ws: WebSocket, message: Message) {
    switch (message.type) {
      case 'document.open':
        await this.handleDocumentOpen(ws, message);
        break;
      case 'buffer.update':
        await this.handleBufferUpdate(ws, message);
        break;
      // ... other message types
    }
  }
}
```

## Testing Strategy

### Unit Tests (Native)

```javascript
// test/document.test.js
const { KateDocument } = require('../');

function testBasicOperations() {
  const doc = new KateDocument();
  
  // Test setText/getText
  doc.setText('Hello\nWorld');
  assert(doc.getText() === 'Hello\nWorld');
  
  // Test line operations
  assert(doc.lineCount === 2);
  assert(doc.line(0) === 'Hello');
  assert(doc.line(1) === 'World');
  
  // Test insertion
  doc.insertText(0, 5, ' there');
  assert(doc.line(0) === 'Hello there');
  
  console.log('✓ Basic operations test passed');
}

testBasicOperations();
```

### Integration Tests

```javascript
// test/integration.test.js
const WebSocket = require('ws');

async function testDocumentSync() {
  const ws = new WebSocket('ws://localhost:5000/kate-bridge');
  
  await new Promise(resolve => ws.on('open', resolve));
  
  // Open document
  ws.send(JSON.stringify({
    type: 'document.open',
    payload: {
      documentId: 'test-1',
      content: 'Hello',
      language: 'JavaScript'
    },
    requestId: 'req-1'
  }));
  
  // Wait for response
  const response = await new Promise(resolve => {
    ws.on('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
  
  assert(response.type === 'document.opened');
  assert(response.payload.success === true);
  
  console.log('✓ Document sync test passed');
}
```

## Performance Considerations

### Optimization Strategies

1. **Batching**: Group multiple updates
2. **Throttling**: Limit syntax request frequency
3. **Caching**: Cache syntax tokens
4. **Lazy Loading**: Load large files incrementally
5. **Worker Threads**: Heavy operations in background

### Benchmarks

Target performance metrics:
- Document creation: <1ms
- Text insertion: <1ms
- Syntax highlighting: <10ms for 100 lines
- Large file (10K lines): <100ms load time
- Memory: <10MB per document

## Error Handling

### Error Categories

```typescript
enum ErrorCode {
  // Native errors
  NATIVE_INIT_FAILED = 'NATIVE_INIT_FAILED',
  DOCUMENT_CREATE_FAILED = 'DOCUMENT_CREATE_FAILED',
  
  // Protocol errors
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  
  // Document errors
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  INVALID_RANGE = 'INVALID_RANGE',
  
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### Error Handling Pattern

```cpp
// C++ layer
try {
    // Operation
    doc->setText(text);
} catch (const std::exception& e) {
    Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
}

// JavaScript layer
try {
    doc.setText(text);
} catch (err) {
    console.error('Failed to set text:', err.message);
    // Send error to frontend
}

// Frontend layer
try {
    await kateClient.setText(documentId, text);
} catch (err) {
    showError(`Failed to update document: ${err.message}`);
}
```

## Security Considerations

1. **Input Validation**: Validate all ranges and text inputs
2. **Path Safety**: Prevent path traversal in file operations
3. **Resource Limits**: Limit document size, connection count
4. **Authentication**: Add token-based auth (future)
5. **Rate Limiting**: Prevent abuse of WebSocket API

## Deployment

### Development

```bash
# Build native module
cd server/native
npm install
npm run build

# Run server
cd ../..
npm run dev
```

### Production

```bash
# Build everything
npm run build

# Set environment
export NODE_ENV=production
export QT_QPA_PLATFORM=offscreen

# Start server
npm start
```

### Docker

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    nodejs npm \
    qt5-default qtbase5-dev \
    libkf5texteditor-dev \
    build-essential cmake pkg-config

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

ENV QT_QPA_PLATFORM=offscreen
CMD ["npm", "start"]
```

## Documentation Requirements

1. **API Documentation**: Complete API reference with examples
2. **Architecture Guide**: System design and data flow
3. **Setup Guide**: Environment setup for all platforms
4. **Protocol Spec**: WebSocket message reference
5. **Troubleshooting**: Common issues and solutions
6. **Contributing Guide**: How to contribute to native module

## Success Criteria

Phase 5 objectives achieved:

- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Research KTextEditor framework architecture** - Comprehensive analysis complete
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Investigate Node.js native binding options** - node-addon-api selected and validated
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Explore Qt/KDE environment requirements** - Dependencies documented, setup verified
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Define Kate ↔ Node.js communication protocol** - Full protocol specification created
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Create proof-of-concept** - Working POC demonstrates feasibility
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **Document technical decisions** - Trade-offs analyzed, recommendations provided

## Next Steps

**Phase 6: Begin Implementation**

1. Set up development environment
2. Create native module skeleton
3. Implement basic Document wrapper
4. Add build and test infrastructure
5. Iterate on API design

## Resources

- [Phase 5 Documentation](./docs/phase5/)
- [KTextEditor API](https://api.kde.org/frameworks/ktexteditor/html/)
- [node-addon-api Guide](https://github.com/nodejs/node-addon-api/blob/main/doc/README.md)
- [Qt Documentation](https://doc.qt.io/)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)

---

**Phase 5 Status**: <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> **COMPLETE**

All research objectives met. Ready to proceed with Phase 6 implementation.
