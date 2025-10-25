# Server (Backend)

This directory contains the Express-based backend server for Kate Neo.

## Key Files for Kate Integration

### `kate-bridge.ts`
Backend bridge for integrating the Kate text editor engine with the frontend. This module will handle:

- WebSocket communication with the frontend
- Kate engine initialization and management
- Buffer synchronization between frontend and Kate
- Syntax highlighting data translation
- Code folding information
- Session management

**Current Status**: Placeholder mode - WebSocket server ready, Kate engine integration pending

**TODO Integration Points**:
- Load Kate engine libraries (KTextEditor framework)
- Initialize KTextEditor framework with Qt/KDE environment
- Create Kate document instances
- Apply text changes to Kate engine buffer
- Query Kate engine for syntax highlighting tokens
- Get code folding regions from Kate engine
- Implement session persistence

## Architecture

```
Frontend (React)
       ↓ WebSocket
  kate-bridge.ts
       ↓ Native Bindings (TODO)
  Kate Engine (C++)
```

## WebSocket Protocol

The bridge implements a message-based protocol for communication with the frontend. See `shared/kate-types.ts` for message type definitions.

### Message Types
- **Connection**: `connection.init`, `connection.ack`, `connection.error`
- **Buffer Operations**: `buffer.open`, `buffer.update`, `buffer.close`, `buffer.save`
- **Syntax**: `syntax.request`, `syntax.response`, `syntax.update`
- **Folding**: `fold.request`, `fold.response`, `fold.toggle`
- **Search**: `search.request`, `search.response`, `search.replace`
- **Session**: `session.create`, `session.load`, `session.save`

## Current Implementation

The WebSocket server is functional and ready to handle messages. Kate engine integration is pending.

## Development

```bash
# From repository root
npm run dev
```

The server runs on port 5000 by default.

## Structure

```
server/
├── kate-bridge.ts   ← Kate engine bridge placeholder
├── index.ts         ← Server entry point
├── routes.ts        ← API routes
├── vite.ts          ← Vite dev server setup
└── storage.ts       ← Storage utilities
```

## Next Steps for Kate Integration

1. **Research Phase**
   - Study KTextEditor framework API
   - Investigate Node.js native binding options (N-API, node-addon-api)
   - Understand Qt/KDE runtime requirements
   - Document build dependencies

2. **Proof of Concept**
   - Create minimal native bindings for KTextEditor
   - Initialize Kate engine in Node.js process
   - Test basic document creation and text operations

3. **Implementation**
   - Build complete native bindings module
   - Implement buffer synchronization protocol
   - Add syntax highlighting translation layer
   - Integrate code folding capabilities
   - Add session management

4. **Testing & Optimization**
   - Performance testing with large files
   - Memory leak detection and prevention
   - Error handling and recovery
   - Integration tests

## Resources

- [KTextEditor Framework Documentation](https://api.kde.org/frameworks/ktexteditor/html/)
- [Node.js N-API Documentation](https://nodejs.org/api/n-api.html)
- [node-addon-api](https://github.com/nodejs/node-addon-api)
- [Qt Documentation](https://doc.qt.io/)

For more details, see the main [README.md](../README.md) in the repository root.
