# Kate Neo Backend

This directory contains the backend bridge that connects the Theia frontend to the Kate text editor engine.

## Overview

The backend serves as an integration layer between:
- **Theia Frontend**: Modern web-based IDE interface
- **Kate Engine**: Powerful KDE text editor engine with advanced features

The bridge handles communication, buffer synchronization, and exposes Kate's capabilities to the Theia frontend.

## Architecture

```
┌─────────────────────┐
│  Theia Frontend     │
│  (Monaco Editor)    │
└──────────┬──────────┘
           │ WebSocket/IPC
           │
┌──────────▼──────────┐
│  Kate Bridge        │
│  (bridge.js)        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Kate Engine        │
│  (Text Processing)  │
└─────────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- Kate editor libraries (TODO: Add installation instructions)

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure Kate engine path:
```bash
export KATE_ENGINE_PATH=/path/to/kate/engine
```

3. Start the bridge:
```bash
node bridge.js
```

## Configuration

Environment variables:
- `KATE_ENGINE_PATH`: Path to Kate engine libraries (default: `/path/to/kate/engine`)
- `BRIDGE_PORT`: Port for communication server (default: `3001`)

## Components

### Bridge Server (`bridge.js`)

Main bridge implementation that:
- Manages connections from Theia frontend
- Synchronizes text buffers between frontend and Kate
- Exposes Kate features via API

**Status**: Placeholder implementation with TODO markers

## TODO: Kate Engine Integration

The following integration tasks are pending:

### 1. Kate Engine Setup
- [ ] Identify Kate libraries and dependencies
- [ ] Determine how to embed/link Kate engine
- [ ] Create Kate engine initialization code
- [ ] Handle Kate library loading and version compatibility

### 2. Communication Protocol
- [ ] Define message format between frontend and bridge
- [ ] Implement WebSocket server for frontend connections
- [ ] Create message routing and handling
- [ ] Add error handling and reconnection logic

### 3. Buffer Synchronization
- [ ] Implement bidirectional buffer sync
- [ ] Handle concurrent edits and conflict resolution
- [ ] Manage undo/redo state across bridge
- [ ] Optimize for large files and multiple documents

### 4. Syntax Highlighting Integration
- [ ] Load Kate syntax definition files
- [ ] Parse syntax highlighting from Kate
- [ ] Convert to Monaco-compatible token format
- [ ] Implement real-time highlighting updates

### 5. Code Folding
- [ ] Extract folding markers from Kate
- [ ] Map to Monaco folding ranges
- [ ] Handle fold/unfold operations
- [ ] Sync folding state between frontend and backend

### 6. Indentation & Formatting
- [ ] Expose Kate's auto-indentation engine
- [ ] Implement formatting provider API
- [ ] Support language-specific indent rules
- [ ] Handle tab/space conversion

### 7. Search & Replace
- [ ] Integrate Kate's search engine
- [ ] Support regex patterns
- [ ] Implement multi-file search
- [ ] Add search result highlighting

### 8. Sessions & State Management
- [ ] Implement session persistence
- [ ] Save/restore open documents
- [ ] Manage cursor positions and selections
- [ ] Handle workspace state

## Development

### Running in Development Mode

```bash
# Start with debug logging
DEBUG=kate:* node bridge.js
```

### Testing

TODO: Add test framework and test cases

```bash
# Run tests (not yet implemented)
npm test
```

## Kate Engine Resources

Resources for integrating the Kate text editor engine:

- **Kate Editor**: https://kate-editor.org/
- **Kate Source**: https://github.com/KDE/kate
- **KTextEditor Framework**: https://api.kde.org/frameworks/ktexteditor/html/
- **KSyntaxHighlighting**: https://api.kde.org/frameworks/syntax-highlighting/html/

### Key Kate Components to Integrate

1. **KTextEditor::Document**: Core document/buffer management
2. **KTextEditor::View**: View and cursor management
3. **KSyntaxHighlighting**: Syntax highlighting engine
4. **Kate::Indenter**: Smart indentation
5. **Kate::Folding**: Code folding system
6. **Kate::Search**: Search and replace

## Submodules

If Kate engine is included as a submodule, initialize with:

```bash
git submodule update --init --recursive
```

## API Documentation

TODO: Document the API once implemented

### Planned Endpoints

- `openDocument(path)`: Open a document in Kate engine
- `closeDocument(docId)`: Close a document
- `applyEdit(docId, changes)`: Apply text changes
- `getHighlighting(docId)`: Get syntax highlighting
- `getFolding(docId)`: Get folding markers
- `search(query, options)`: Perform search
- `format(docId, range)`: Format code

## Contributing

When working on the backend bridge:

1. Add comprehensive TODO comments for deferred work
2. Document the Kate engine integration points
3. Keep the frontend-backend protocol well-defined
4. Test with various file types and sizes
5. Handle edge cases and errors gracefully

## License

TODO: Specify license compatible with Kate/KDE licensing
