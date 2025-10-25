# Shared Types

This directory contains TypeScript type definitions and interfaces shared between the frontend (client) and backend (server).

## Key Files

### `kate-types.ts`
Comprehensive type definitions for Kate engine integration and frontend-backend communication.

**Contains**:
- Position and Range types for text documents
- TextChange and BufferUpdate for buffer synchronization
- DocumentMetadata for file information
- SyntaxToken and SyntaxHighlighting for syntax highlighting
- FoldingRegion for code folding
- SearchOptions and SearchResult for search functionality
- ReplaceOperation for find and replace
- KateSession for session management
- Message types for WebSocket protocol
- Helper functions for message creation and validation

**Current Status**: Complete type definitions for planned Kate integration

**TODO**:
- Add protocol versioning as integration progresses
- Expand types based on Kate engine capabilities
- Add semantic highlighting support
- Map Kate token types to Monaco/Theia token types
- Add error type definitions
- Document all complex types with examples

## Usage

These types are used by both the client and server to ensure type safety across the WebSocket communication layer.

### Frontend Example
```typescript
import { createMessage, BufferUpdate } from '@/shared/kate-types';

// Create a buffer update message
const message = createMessage<BufferUpdate>('buffer.update', {
  documentId: 'file-123',
  changes: [{
    range: { start: { line: 0, column: 0 }, end: { line: 0, column: 5 } },
    text: 'Hello'
  }],
  version: 1
});

// Send via WebSocket
ws.send(JSON.stringify(message));
```

### Backend Example
```typescript
import { Message, isMessage, BufferUpdate } from './shared/kate-types';

// Validate and parse incoming message
const data = JSON.parse(messageData);
if (isMessage(data)) {
  if (data.type === 'buffer.update') {
    const update = data.payload as BufferUpdate;
    // Process buffer update
  }
}
```

## Type Hierarchy

```
Message<T>
├── type: MessageType
├── payload: T
├── requestId?: string
└── timestamp?: number

MessageType (union of all message types)
├── Connection messages
├── Buffer operation messages
├── Syntax highlighting messages
├── Code folding messages
├── Search messages
└── Session messages
```

## Protocol Design

The types define a complete protocol for Kate engine integration:

1. **Connection Management**: Initialize and maintain WebSocket connection
2. **Document Lifecycle**: Open, edit, save, and close documents
3. **Buffer Synchronization**: Apply and broadcast text changes
4. **Syntax Highlighting**: Request and receive highlighting data
5. **Code Folding**: Query and toggle fold regions
6. **Search & Replace**: Perform text search and replacement
7. **Session Management**: Save and restore editing sessions

## Adding New Types

When adding new types for Kate integration:

1. Add the type definition to `kate-types.ts`
2. Add JSDoc comments explaining the purpose
3. Mark with TODO comments if implementation is pending
4. Export the type for use in client and server
5. Update this README with usage examples

## Future Enhancements

- Add protocol versioning for backward compatibility
- Include semantic token types for LSP integration
- Add diagnostic types for error reporting
- Define configuration types for Kate engine settings
- Add telemetry types for performance monitoring

For more details, see the main [README.md](../README.md) in the repository root.
