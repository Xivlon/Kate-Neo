# Kate IDE Core Services

This directory contains the core services and managers that power the Kate Neo IDE. These services follow the architecture outlined in the "Kate Neo IDE Development.txt" master plan.

## Architecture Overview

The IDE is built on a modular service-oriented architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                       │
│  (UI layer - FileTree, Editor, Terminal, etc.)          │
└────────────────┬────────────────────────────────────────┘
                 │ React Hooks (useIDE.ts)
┌────────────────▼────────────────────────────────────────┐
│                  Core Services Layer                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Workspace    │  │ LSP Manager  │  │ Terminal     │ │
│  │ Manager      │  │              │  │ Manager      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Settings     │  │ Git Service  │  │ File System  │ │
│  │ Manager      │  │              │  │ Watcher      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │ Panel        │  │  Event Bus (Communication)   │   │
│  │ Manager      │  │                              │   │
│  └──────────────┘  └──────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend Services (TODO)                     │
│  (Kate engine, LSP servers, PTY, Git operations)        │
└─────────────────────────────────────────────────────────┘
```

## Core Services

### 1. LSP Manager (`lsp/LSPManager.ts`)

**Purpose**: Language Server Protocol integration for intelligent code features.

**Features**:
- Initialize and manage language servers for different languages
- Provide code completions
- Hover information and tooltips
- Diagnostics (errors, warnings)
- Document symbols and outline
- Code formatting

**Usage**:
```typescript
import { lspManager } from '@/lib';

// Open a document
await lspManager.didOpenTextDocument({
  uri: 'file:///path/to/file.ts',
  languageId: 'typescript',
  version: 1,
  text: fileContent,
});

// Get completions
const completions = await lspManager.provideCompletions(
  'file:///path/to/file.ts',
  { line: 10, character: 5 }
);
```

**Status**: ✅ Foundation implemented, ⏳ Backend integration pending

### 2. Workspace Manager (`workspace/WorkspaceManager.ts`)

**Purpose**: Document lifecycle and workspace state management.

**Features**:
- Open and close documents
- Track document versions and dirty state
- Save documents and handle auto-save
- Workspace configuration
- Document change notifications

**Usage**:
```typescript
import { workspaceManager } from '@/lib';

// Open a document
const doc = await workspaceManager.openDocument(
  '/path/to/file.js',
  fileContent,
  'javascript'
);

// Update document content
workspaceManager.updateDocument(doc.uri, newContent);

// Save document
await workspaceManager.saveDocument(doc.uri);

// Listen to changes
const unsubscribe = workspaceManager.onDocumentChange((doc) => {
  console.log('Document changed:', doc.path);
});
```

**Status**: ✅ Foundation implemented, ⏳ Backend integration pending

### 3. Event Bus (`events/EventBus.ts`)

**Purpose**: Centralized publish-subscribe event system for decoupled component communication.

**Features**:
- Type-safe event system
- Subscribe to specific events or all events
- One-time event subscriptions
- Event filtering and routing

**Usage**:
```typescript
import { eventBus, IDEEventType } from '@/lib';

// Subscribe to events
const subscription = eventBus.on(IDEEventType.DOCUMENT_SAVED, (data) => {
  console.log('Document saved:', data);
});

// Emit events
eventBus.emit(IDEEventType.FILE_CREATED, {
  path: '/new/file.txt',
  timestamp: Date.now(),
});

// Unsubscribe
subscription.unsubscribe();
```

**Status**: ✅ Fully implemented

### 4. File System Watcher (`fs/FileSystemWatcher.ts`)

**Purpose**: Monitor file system changes and notify interested parties.

**Features**:
- Watch specific paths for changes
- Detect file creation, modification, deletion, and renaming
- Emit events for file system changes
- Integration with event bus

**Usage**:
```typescript
import { fileSystemWatcher } from '@/lib';

// Watch a directory
const unwatch = fileSystemWatcher.watch('/project/src', (event) => {
  console.log(`File ${event.type}:`, event.path);
});

// Stop watching
unwatch();
```

**Status**: ✅ Foundation implemented, ⏳ Backend integration pending

### 5. Settings Manager (`settings/SettingsManager.ts`)

**Purpose**: Application and workspace settings with persistence.

**Features**:
- User-level and workspace-level settings
- Type-safe settings access
- Automatic persistence to localStorage
- Settings import/export
- Deep merging of settings

**Usage**:
```typescript
import { settingsManager } from '@/lib';

// Get a setting
const fontSize = settingsManager.get('editor', 'fontSize');

// Update a setting
settingsManager.set('editor', 'fontSize', 16, 'user');

// Get all settings
const allSettings = settingsManager.getAll();

// Reset to defaults
settingsManager.reset('user');
```

**Status**: ✅ Fully implemented

### 6. Terminal Manager (`terminal/TerminalManager.ts`)

**Purpose**: Integrated terminal session management.

**Features**:
- Create and manage terminal sessions
- Send input to terminals
- Receive output from terminals
- Resize terminal windows
- Multiple concurrent terminal sessions

**Usage**:
```typescript
import { terminalManager } from '@/lib';

// Create a terminal session
const session = await terminalManager.createSession('/project', 'bash');

// Listen to output
const unsubscribe = terminalManager.onOutput(session.id, (output) => {
  console.log('Terminal output:', output.data);
});

// Send input
await terminalManager.sendInput(session.id, 'ls -la\n');

// Close session
await terminalManager.closeSession(session.id);
```

**Status**: ✅ Foundation implemented, ⏳ Backend PTY integration pending

### 7. Git Service (`git/GitService.ts`)

**Purpose**: Version control integration with Git.

**Features**:
- Repository status tracking
- Stage and unstage files
- Commit changes
- Branch management (create, checkout, delete)
- Pull and push operations
- View commit history
- File diffs

**Usage**:
```typescript
import { gitService } from '@/lib';

// Initialize for a repository
await gitService.initialize('/project');

// Get status
const status = await gitService.getStatus();

// Stage a file
await gitService.stageFile('src/index.ts');

// Commit
const commitHash = await gitService.commit('Add new feature');

// Checkout branch
await gitService.checkoutBranch('develop');
```

**Status**: ✅ Foundation implemented, ⏳ Backend integration pending

### 8. Panel Manager (`ui/PanelManager.ts`)

**Purpose**: UI panel and layout management.

**Features**:
- Register and manage UI panels
- Show/hide panels
- Resize and reposition panels
- Save and restore layouts
- Default panel configuration

**Usage**:
```typescript
import { panelManager } from '@/lib';

// Register a panel
panelManager.registerPanel({
  id: 'my-panel',
  title: 'My Panel',
  position: 'left',
  visible: true,
  size: 250,
});

// Toggle panel visibility
panelManager.togglePanel('terminal');

// Get panels by position
const leftPanels = panelManager.getPanelsByPosition('left');

// Listen to changes
const unsubscribe = panelManager.onChange((panels) => {
  console.log('Panels changed:', panels);
});
```

**Status**: ✅ Fully implemented

## React Hooks

The `hooks/useIDE.ts` file provides React hooks for easy integration with components:

### useWorkspace()
Access workspace and document management
```typescript
const { documents, activeDocument, openDocument, saveDocument } = useWorkspace();
```

### useLSP(documentUri)
Access LSP features for a document
```typescript
const { diagnostics, getCompletions, getHover } = useLSP(document.uri);
```

### useSettings()
Access and modify settings
```typescript
const { settings, getSetting, setSetting } = useSettings();
```

### useTerminal()
Manage terminal sessions
```typescript
const { sessions, createSession, sendInput } = useTerminal();
```

### useGit()
Access Git operations
```typescript
const { status, stageFile, commit, initialize } = useGit();
```

### useFileWatcher(path)
Watch file system changes
```typescript
const { changes, onFileChange } = useFileWatcher('/project/src');
```

### useIDEEvent(eventType, handler)
Subscribe to IDE events
```typescript
useIDEEvent(IDEEventType.DOCUMENT_SAVED, (data) => {
  console.log('Document saved:', data);
});
```

## Event Types

The Event Bus uses typed events defined in `IDEEventType`:

### Document Events
- `DOCUMENT_OPENED` - A document was opened
- `DOCUMENT_CHANGED` - Document content changed
- `DOCUMENT_SAVED` - Document was saved
- `DOCUMENT_CLOSED` - Document was closed

### Editor Events
- `EDITOR_FOCUS_CHANGED` - Editor focus changed
- `EDITOR_SELECTION_CHANGED` - Text selection changed
- `EDITOR_CURSOR_MOVED` - Cursor position changed

### File System Events
- `FILE_CREATED` - File created
- `FILE_CHANGED` - File modified
- `FILE_DELETED` - File deleted
- `FILE_RENAMED` - File renamed

### Workspace Events
- `WORKSPACE_OPENED` - Workspace opened
- `WORKSPACE_CLOSED` - Workspace closed
- `WORKSPACE_CONFIG_CHANGED` - Configuration changed

### LSP Events
- `LSP_DIAGNOSTICS_UPDATED` - Diagnostics updated
- `LSP_SERVER_STARTED` - Language server started
- `LSP_SERVER_STOPPED` - Language server stopped

### Git Events
- `GIT_STATUS_CHANGED` - Repository status changed
- `GIT_BRANCH_CHANGED` - Current branch changed

### Terminal Events
- `TERMINAL_CREATED` - Terminal session created
- `TERMINAL_OUTPUT` - Terminal produced output
- `TERMINAL_CLOSED` - Terminal session closed

### UI Events
- `THEME_CHANGED` - Color theme changed
- `PANEL_OPENED` - UI panel opened
- `PANEL_CLOSED` - UI panel closed

## Integration with Components

Components can use these services through hooks or direct imports:

```typescript
// Using hooks (recommended for React components)
import { useWorkspace, useSettings } from '@/hooks/useIDE';

function MyComponent() {
  const { documents, openDocument } = useWorkspace();
  const { settings } = useSettings();
  // ...
}

// Direct import (for non-React code)
import {
  workspaceManager,
  lspManager,
  eventBus,
  IDEEventType,
  settingsManager,
} from '@/lib';
```

## Next Steps

All services are currently in **foundation mode** with placeholder implementations. The next phase involves:

1. **Backend Integration**: Connect services to backend APIs
   - LSP: Connect to language server processes
   - Workspace: Integrate with file system APIs
   - Terminal: Connect to PTY processes
   - Git: Integrate with git2 or similar library

2. **WebSocket Protocol**: Implement real-time communication
   - Define message protocol
   - Implement reconnection logic
   - Add message queuing

3. **Error Handling**: Add comprehensive error handling
   - Network errors
   - Backend errors
   - State recovery

4. **Testing**: Add unit and integration tests
   - Service unit tests
   - Event flow tests
   - Integration tests
   - Hook tests

## Development Guidelines

When extending these services:

1. **Maintain the Interface**: Public APIs should remain stable
2. **Use Events**: Communicate changes through the event bus
3. **Add TODOs**: Mark backend integration points clearly
4. **Document Changes**: Update this README when adding features
5. **Type Safety**: Use TypeScript types throughout
6. **Error Handling**: Gracefully handle errors and edge cases
7. **Use Hooks**: Create React hooks for new services

## Reference

See the master plan document: `Kate Neo IDE Development.txt` for the complete architecture vision.
