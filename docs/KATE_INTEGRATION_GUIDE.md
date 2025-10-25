# Kate Native Module - Developer Integration Guide

This guide explains how to integrate the Kate native module into Kate Neo IDE components.

## Quick Start

### 1. Check Kate Availability

```typescript
import { kateService } from './server/kate-service';

const status = kateService.getStatus();
console.log('Kate available:', status.available);
console.log('Qt running:', status.qtRunning);
console.log('Version:', status.version);
```

### 2. Create a Document

```typescript
// Create a new document
const documentId = kateService.createDocument(
  '/path/to/file.js',  // File path
  'JavaScript',         // Language mode
  'console.log("Hello");'  // Initial content
);

console.log('Created document:', documentId);
```

### 3. Get Document Content

```typescript
// Get document
const doc = kateService.getDocument(documentId);

if (doc) {
  console.log('Text:', doc.getText());
  console.log('Lines:', doc.getLineCount());
  console.log('Mode:', doc.getMode());
}
```

### 4. Edit Document

```typescript
// Apply a buffer update
const bufferUpdate = {
  documentId: documentId,
  version: 1,
  changes: [{
    range: {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 }
    },
    text: '// New comment\n'
  }]
};

kateService.applyBufferUpdate(bufferUpdate);
```

### 5. Close Document

```typescript
kateService.closeDocument(documentId);
```

## WebSocket Protocol

### Client → Server

**Open Document**:
```json
{
  "type": "buffer.open",
  "payload": {
    "documentId": "doc-123",
    "filePath": "/path/to/file.js",
    "content": "initial content",
    "language": "JavaScript"
  }
}
```

**Update Buffer**:
```json
{
  "type": "buffer.update",
  "payload": {
    "documentId": "doc-123",
    "version": 2,
    "changes": [{
      "range": {
        "start": { "line": 0, "column": 0 },
        "end": { "line": 0, "column": 7 }
      },
      "text": "updated"
    }]
  }
}
```

**Close Document**:
```json
{
  "type": "buffer.close",
  "payload": {
    "documentId": "doc-123"
  }
}
```

### Server → Client

**Buffer Opened**:
```json
{
  "type": "buffer.opened",
  "payload": {
    "documentId": "doc-123",
    "success": true,
    "kateAvailable": true,
    "metadata": {
      "documentId": "doc-123",
      "filePath": "/path/to/file.js",
      "language": "JavaScript",
      "version": 0,
      "isDirty": false
    }
  }
}
```

**Buffer Updated**:
```json
{
  "type": "buffer.updated",
  "payload": {
    "documentId": "doc-123",
    "changes": [...],
    "version": 2
  }
}
```

## Frontend Integration

### Using in React Components

```typescript
import { useEffect, useState } from 'react';

function KateEditorComponent({ filePath, language, content }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [kateStatus, setKateStatus] = useState({ available: false });

  useEffect(() => {
    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:5000');
    
    websocket.onopen = () => {
      console.log('Connected to Kate bridge');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'connected':
          setKateStatus(message.payload);
          // Open document
          websocket.send(JSON.stringify({
            type: 'buffer.open',
            payload: {
              documentId: 'doc-' + Date.now(),
              filePath,
              content,
              language
            }
          }));
          break;
          
        case 'buffer.opened':
          setDocumentId(message.payload.documentId);
          break;
          
        case 'buffer.updated':
          // Handle buffer update
          console.log('Buffer updated:', message.payload);
          break;
      }
    };

    setWs(websocket);

    return () => {
      if (documentId) {
        websocket.send(JSON.stringify({
          type: 'buffer.close',
          payload: { documentId }
        }));
      }
      websocket.close();
    };
  }, [filePath]);

  return (
    <div>
      <div>Kate Available: {kateStatus.available ? 'Yes' : 'No'}</div>
      <div>Document ID: {documentId || 'None'}</div>
      {/* Your editor UI here */}
    </div>
  );
}
```

## Fallback Mode

The system gracefully handles cases where KTextEditor is not available:

```typescript
const status = kateService.getStatus();

if (!status.available) {
  console.warn('Running in fallback mode');
  console.warn('Install Qt5 and KF5 for full functionality');
  // Still works, but without Kate features
}

// All operations work in fallback mode
const doc = kateService.createDocument('/tmp/test.txt', 'text', 'hello');
console.log('Text:', kateService.getDocumentText(doc)); // Works!
```

## Advanced Usage

### Direct Native Module Access

```typescript
// Only if you need direct access to native module
try {
  const kateNative = require('@kate-neo/native');
  
  if (kateNative.isKateAvailable()) {
    const doc = kateNative.createDocument();
    doc.setText('Direct access to Kate');
    console.log(doc.getText());
  }
} catch (error) {
  console.log('Native module not available');
}
```

### Custom Buffer Operations

```typescript
const doc = kateService.getDocument(documentId);

if (doc) {
  // Insert text
  doc.insertText(0, 0, '// Header\n');
  
  // Remove text
  doc.removeText(0, 0, 0, 10);
  
  // Set mode
  doc.setMode('Python');
  
  // Undo/Redo
  doc.undo();
  doc.redo();
}
```

## Error Handling

```typescript
try {
  const docId = kateService.createDocument(filePath, language, content);
  
  // Apply changes
  kateService.applyBufferUpdate(update);
  
} catch (error) {
  console.error('Kate operation failed:', error);
  // Fallback to alternative implementation
}
```

## Testing

### Unit Tests

```typescript
import { kateService } from './server/kate-service';

describe('KateService', () => {
  it('should create document', () => {
    const docId = kateService.createDocument('/tmp/test.txt', 'text', 'hello');
    expect(docId).toBeTruthy();
  });
  
  it('should get document text', () => {
    const docId = kateService.createDocument('/tmp/test.txt', 'text', 'hello');
    const text = kateService.getDocumentText(docId);
    // In fallback mode, might be empty
    expect(text !== null).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Kate WebSocket Bridge', () => {
  it('should open document via WebSocket', async () => {
    const ws = new WebSocket('ws://localhost:5000');
    
    await new Promise(resolve => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'buffer.open',
          payload: {
            documentId: 'test-doc',
            filePath: '/tmp/test.txt',
            content: 'test',
            language: 'text'
          }
        }));
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'buffer.opened') {
          expect(msg.payload.success).toBe(true);
          resolve();
        }
      };
    });
  });
});
```

## Best Practices

1. **Always check availability**: Use `kateService.getStatus()` to check if Kate is available
2. **Handle fallback mode**: Ensure your code works even without KTextEditor
3. **Error handling**: Wrap Kate operations in try-catch blocks
4. **Clean up**: Always close documents when done
5. **Validate input**: Check ranges and text before operations

## Debugging

Enable debug logging:

```typescript
// In kate-bridge.ts
const bridge = new KateBridge({ debug: true });
```

Check native module:

```bash
cd packages/kate-native
npm test
node examples/simple.js
```

Monitor WebSocket:

```javascript
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Platform Notes

### Linux (Recommended)
- Full native support
- Best performance
- All features available

### macOS
- Install via Homebrew
- May need environment variables
- Some features limited

### Windows
- Use WSL2 for best results
- Native build experimental
- Limited testing

## Resources

- [KTextEditor API](https://api.kde.org/frameworks/ktexteditor/html/)
- [Native Module README](./packages/kate-native/README.md)
- [Phase 6 Implementation](./PHASE6_IMPLEMENTATION.md)
- [WebSocket Protocol Spec](./docs/phase5/4-communication-protocol.md)
