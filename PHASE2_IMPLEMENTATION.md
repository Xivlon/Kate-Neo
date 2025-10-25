# Phase 2: Essential IDE Features - Implementation Guide

This document describes the implementation of Phase 2 features for Kate Neo IDE, including debugging, version control, and terminal integration.

## Overview

Phase 2 adds essential IDE functionality that developers expect in a modern development environment:

1. **Debugging System** - Debug Adapter Protocol (DAP) integration
2. **Version Control** - Git integration for source control
3. **Terminal Integration** - Integrated terminal with PTY support

## Architecture

### Backend Services

All Phase 2 services are implemented as standalone TypeScript modules in the `server/` directory:

- `server/debug-service.ts` - Debug Adapter Protocol implementation
- `server/git-service.ts` - Git operations and repository management
- `server/terminal-service.ts` - Terminal session management with PTY

### Frontend Components

React components are located in `client/src/components/`:

- `DebugPanel.tsx` - Debug UI with breakpoints, call stack, and variables
- `SourceControlPanel.tsx` - Git operations UI
- `TerminalPanel.tsx` - Terminal interface

### API Routes

All API endpoints are defined in `server/routes.ts`:

- `/api/debug/*` - Debug operations
- `/api/git/*` - Git operations
- `/api/terminal` - WebSocket endpoint for terminal

## Debugging System (DAP Integration)

### Features

- **Session Management**: Start, stop, pause, and continue debug sessions
- **Breakpoint Management**: Set and verify breakpoints in source files
- **Stack Inspection**: View call stack when execution is paused
- **Variable Inspection**: Examine variables in the current scope
- **Expression Evaluation**: Evaluate expressions in debug context

### API Endpoints

```typescript
POST   /api/debug/sessions              // Create new debug session
GET    /api/debug/sessions              // List all sessions
POST   /api/debug/sessions/:id/breakpoints  // Set breakpoints
POST   /api/debug/sessions/:id/continue    // Continue execution
POST   /api/debug/sessions/:id/pause       // Pause execution
DELETE /api/debug/sessions/:id           // Terminate session
```

### Usage Example

```typescript
// Start a debug session
const response = await fetch("/api/debug/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "node",
    name: "Debug Session",
    request: "launch",
    program: "${workspaceFolder}/index.js",
    stopOnEntry: true,
  }),
});

const { sessionId } = await response.json();

// Set breakpoints
await fetch(`/api/debug/sessions/${sessionId}/breakpoints`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    source: "src/main.ts",
    breakpoints: [
      { line: 10, column: 0 },
      { line: 25, column: 0, condition: "x > 5" }
    ]
  }),
});
```

### Implementation Notes

The current implementation provides the DAP service structure but does not yet connect to actual debug adapters. To integrate with real debuggers:

1. Add debug adapter dependencies (e.g., `vscode-debugadapter`)
2. Implement adapter process spawning in `DebugSession.start()`
3. Implement JSON-RPC communication with adapters
4. Parse adapter responses and update session state

## Version Control (Git Integration)

### Features

- **File Status Tracking**: Monitor working directory changes
- **Staging**: Stage and unstage files
- **Commits**: Create commits with messages
- **Branch Management**: List, switch, and create branches
- **History**: View commit history
- **Diff Viewing**: See file changes (API ready, UI pending)

### API Endpoints

```typescript
GET  /api/git/status                    // Get file status
GET  /api/git/branches                  // List branches
GET  /api/git/branch/current            // Get current branch
POST /api/git/branch/checkout           // Checkout branch
POST /api/git/stage                     // Stage file
POST /api/git/unstage                   // Unstage file
POST /api/git/commit                    // Create commit
GET  /api/git/diff/:filePath            // Get file diff
GET  /api/git/history                   // Get commit history
```

### Usage Example

```typescript
// Get repository status
const status = await fetch("/api/git/status").then(r => r.json());

// Stage a file
await fetch("/api/git/stage", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filePath: "src/main.ts" }),
});

// Create a commit
await fetch("/api/git/commit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Add new feature" }),
});

// Switch branch
await fetch("/api/git/branch/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ branchName: "feature-branch" }),
});
```

### Implementation Notes

The Git service uses the `git` command-line tool via `child_process`. Ensure Git is installed and available in the system PATH. The service:

- Automatically detects Git repositories
- Parses `git status --porcelain` output
- Supports both staged and unstaged changes
- Includes basic error handling

## Terminal Integration

### Features

- **Multiple Sessions**: Create and manage multiple terminal instances
- **Real-time I/O**: WebSocket-based communication for instant response
- **Shell Detection**: Automatic detection of system shell (bash, zsh, cmd, etc.)
- **Session Management**: Create, write to, resize, and kill sessions

### WebSocket Protocol

Connect to: `ws://localhost:5000/api/terminal`

Message format:
```typescript
// Client -> Server
{
  type: "create",           // Create new terminal
  config?: {
    shell?: string,
    cwd?: string,
    env?: Record<string, string>
  }
}

{
  type: "input",            // Send input to terminal
  data: string
}

{
  type: "resize",           // Resize terminal
  dimensions: {
    cols: number,
    rows: number
  }
}

{
  type: "kill"              // Kill terminal session
}

// Server -> Client
{
  type: "created",
  sessionId: string
}

{
  type: "data",
  sessionId: string,
  data: string              // Terminal output
}

{
  type: "exit",
  sessionId: string,
  code: number
}
```

### Usage Example

```typescript
const ws = new WebSocket("ws://localhost:5000/api/terminal");

ws.onopen = () => {
  // Create terminal
  ws.send(JSON.stringify({
    type: "create",
    config: { cwd: "/home/user/project" }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === "created") {
    console.log("Terminal created:", message.sessionId);
    
    // Send command
    ws.send(JSON.stringify({
      type: "input",
      data: "ls -la\n"
    }));
  } else if (message.type === "data") {
    console.log("Output:", message.data);
  }
};
```

### Implementation Notes

The current implementation uses basic `child_process.spawn()` which provides limited PTY features. For production use:

1. Install `node-pty` package for proper PTY support
2. Update `TerminalSession` to use `node-pty.spawn()`
3. Implement proper terminal resize with PTY
4. Add support for terminal colors and control sequences

## UI Integration

### Sidebar Tabs

The main editor UI includes a tabbed sidebar with three panels:

1. **Files** (File Explorer) - Browse and open files
2. **Git** (Source Control) - Git operations and status
3. **Debug** (Debugger) - Debug sessions and controls

Switch between panels by clicking the tab headers.

### Terminal Panel

The terminal panel is collapsible and located at the bottom of the editor:

- Click the "Terminal" button in the status bar to show/hide
- Resize vertically by dragging the panel separator
- Create multiple terminal sessions with the "+" button
- Close sessions with the "X" button on each tab

### Keyboard Shortcuts

- `Ctrl+S` - Save current file
- `Ctrl+N` - New file
- `Ctrl+F` - Find/Replace
- Terminal input - Type and press Enter to execute commands

## Testing

### Manual Testing

1. **Debug Panel**:
   - Click Debug tab in sidebar
   - Click Play button to start a debug session
   - Verify session appears in the panel

2. **Git Panel**:
   - Make changes to files
   - Click Git tab to see changed files
   - Stage files with "+" button
   - Enter commit message and commit

3. **Terminal**:
   - Click "Terminal" in status bar
   - Terminal panel should appear
   - Type commands and verify output

### Automated Testing

To add automated tests:

1. Create test files in `server/tests/` and `client/tests/`
2. Add test commands to `package.json`
3. Test API endpoints with supertest
4. Test UI components with React Testing Library

## Future Enhancements

### Debugging
- [ ] Connect to real debug adapters (Node.js, Python, etc.)
- [ ] Implement conditional breakpoints
- [ ] Add watch expressions
- [ ] Support for logpoints
- [ ] Multi-threaded debugging

### Git
- [ ] Visual diff viewer
- [ ] Merge conflict resolution
- [ ] Pull/push operations
- [ ] Stash management
- [ ] Git graph visualization

### Terminal
- [ ] Upgrade to node-pty for full PTY support
- [ ] Terminal themes and customization
- [ ] Split terminal panels
- [ ] Terminal search
- [ ] Command history

## Troubleshooting

### Git service not working
- Ensure Git is installed: `git --version`
- Check repository is initialized: `git status`
- Verify file permissions

### Terminal not connecting
- Check WebSocket connection in browser console
- Verify no firewall blocking WebSocket connections
- Check server logs for errors

### Debug session fails to start
- Verify debug configuration is correct
- Check program path exists
- Review server logs for errors

## API Reference

See inline JSDoc comments in source files for detailed API documentation:

- `server/debug-service.ts` - Debug service API
- `server/git-service.ts` - Git service API
- `server/terminal-service.ts` - Terminal service API

## Contributing

When adding new Phase 2 features:

1. Add service implementation in `server/`
2. Create UI component in `client/src/components/`
3. Add API routes in `server/routes.ts`
4. Update this documentation
5. Add tests
6. Update README.md

## License

MIT License - See LICENSE file for details
