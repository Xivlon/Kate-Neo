# Phase 3: Advanced Features & Polish - Implementation Guide

This document describes the implementation of Phase 3 features for Kate Neo IDE, including the extension system and performance optimizations.

## Overview

Phase 3 adds advanced functionality to enhance the IDE's extensibility and performance:

1. **Extension System** - Plugin architecture for extending IDE functionality
2. **Performance Optimization** - Large file handling and virtualized UI components

## Extension System

### Architecture

The extension system allows developers to create plugins that extend Kate Neo's functionality through a well-defined API.

#### Backend Components

- `server/extension-host.ts` - Extension host that manages extension lifecycle
- `shared/extension-types.ts` - Type definitions for extensions and API

#### Frontend Components

- `client/src/components/ExtensionsPanel.tsx` - UI for managing extensions

#### Example Extension

- `extensions/hello-world/` - Example extension demonstrating the API

### Extension API

Extensions can access the following APIs:

#### Workspace API
```typescript
workspace.rootPath              // Get workspace root
workspace.workspaceFolders      // Get workspace folders
workspace.registerFileSystemProvider()  // Register custom file system
workspace.openTextDocument()    // Open document
workspace.saveAll()             // Save all documents
```

#### Languages API
```typescript
languages.registerCompletionProvider()  // Provide completions
languages.registerHoverProvider()       // Provide hover information
languages.registerCodeLensProvider()    // Provide code lenses
```

#### Window API
```typescript
window.showInformationMessage() // Show info message
window.showWarningMessage()     // Show warning
window.showErrorMessage()       // Show error
window.showQuickPick()          // Show quick pick menu
window.createOutputChannel()    // Create output channel
```

#### Commands API
```typescript
commands.registerCommand()      // Register command
commands.executeCommand()       // Execute command
commands.getCommands()          // List all commands
```

### Extension Manifest

Extensions are defined using a `package.json` manifest:

```json
{
  "id": "publisher.extension-name",
  "name": "Extension Name",
  "version": "1.0.0",
  "publisher": "Publisher Name",
  "description": "Extension description",
  "main": "index.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "extension.commandId",
        "title": "Command Title",
        "category": "Category"
      }
    ]
  },
  "engines": {
    "kateNeo": "^1.0.0"
  }
}
```

### Extension Structure

```
extension-name/
├── package.json    # Extension manifest
├── index.js        # Extension entry point
└── README.md       # Extension documentation
```

### Extension Lifecycle

1. **Discovery** - Extension host scans `extensions/` directory
2. **Loading** - Extension manifest is loaded and validated
3. **Activation** - Extension's `activate()` function is called
4. **Active** - Extension is running and can respond to events
5. **Deactivation** - Extension's `deactivate()` function is called

### Creating an Extension

#### 1. Create Extension Directory

```bash
mkdir -p extensions/my-extension
cd extensions/my-extension
```

#### 2. Create package.json

```json
{
  "id": "my-publisher.my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "publisher": "My Publisher",
  "description": "My awesome extension",
  "main": "index.js",
  "activationEvents": ["*"]
}
```

#### 3. Create index.js

```javascript
module.exports = {
  activate: function(context) {
    console.log('Extension activated!');
    
    // Register a command
    const disposable = context.api.commands.registerCommand(
      'myExtension.doSomething',
      () => {
        context.api.window.showInformationMessage('Hello from my extension!');
      }
    );
    
    context.subscriptions.push(disposable);
  },
  
  deactivate: function() {
    console.log('Extension deactivated!');
  }
};
```

### API Endpoints

#### List Extensions
```http
GET /api/extensions
```

Response:
```json
{
  "extensions": [
    {
      "id": "kate-neo.hello-world",
      "name": "Hello World Extension",
      "version": "1.0.0",
      "description": "Example extension",
      "publisher": "Kate Neo Team",
      "state": "active",
      "activatedAt": 1234567890
    }
  ]
}
```

#### Activate Extension
```http
POST /api/extensions/:id/activate
```

#### Deactivate Extension
```http
POST /api/extensions/:id/deactivate
```

#### List Commands
```http
GET /api/extensions/commands
```

#### Execute Command
```http
POST /api/extensions/commands/:command
```

Request body:
```json
{
  "args": []
}
```

### Extension UI

The Extensions panel is accessible from the sidebar and provides:

- **Extension List** - View all installed extensions
- **Search** - Filter extensions by name or description
- **Activate/Deactivate** - Control extension state
- **Refresh** - Reload extension list
- **Status Badges** - Visual indicators for extension state

## Performance Optimization

### Large File Manager

The Large File Manager enables efficient handling of files too large to load entirely into memory.

#### Features

- **Chunked Loading** - Load only visible portions of files
- **Line Indexing** - Fast random access to any line
- **Streaming** - Memory-efficient file reading
- **Viewport Calculation** - Determine visible range based on scroll position

#### Implementation

Location: `server/large-file-manager.ts`

#### Configuration

```typescript
const largeFileManager = new LargeFileManager({
  chunkSize: 1000,              // Lines per chunk
  maxFullLoadSize: 5 * 1024 * 1024,  // 5MB threshold
  enableIndexing: true,         // Enable line indexing
});
```

#### API Endpoints

##### Get File Metadata
```http
GET /api/files/metadata/:filePath
```

Response:
```json
{
  "path": "/path/to/file.txt",
  "size": 52428800,
  "lineCount": 1000000,
  "indexed": true,
  "encoding": "utf-8",
  "useLargeFileHandling": true
}
```

##### Build Line Index
```http
POST /api/files/index/:filePath
```

##### Get File Chunk
```http
GET /api/files/chunk/:filePath?startLine=0&lineCount=100
```

Response:
```json
{
  "startLine": 0,
  "lineCount": 100,
  "content": "...",
  "byteOffset": 0,
  "byteLength": 5432
}
```

##### Get File Statistics
```http
GET /api/files/stats/:filePath
```

### Virtualized UI Components

Virtualized components render only visible items for improved performance with large datasets.

#### VirtualizedTree

Location: `client/src/components/VirtualizedTree.tsx`

A tree component that efficiently renders large hierarchical data:

```typescript
<VirtualizedTree
  nodes={treeNodes}
  itemHeight={24}
  height={600}
  overscan={5}
  renderItem={(node, depth) => (
    <div>{node.label}</div>
  )}
  onItemClick={(node) => console.log(node)}
/>
```

#### VirtualizedList

A list component for flat large datasets:

```typescript
<VirtualizedList
  items={largeArray}
  itemHeight={32}
  height={400}
  overscan={10}
  renderItem={(item, index) => (
    <div>{item.name}</div>
  )}
  getItemKey={(item) => item.id}
  onItemClick={(item) => console.log(item)}
/>
```

#### Features

- **Viewport-based Rendering** - Only render visible items
- **Overscan Support** - Render extra items for smooth scrolling
- **Automatic Scrolling** - Efficient scroll event handling
- **Tree Expansion** - Hook for managing tree state

#### Tree Expansion Hook

```typescript
const {
  expandedNodes,
  toggleNode,
  expandNode,
  collapseNode,
  expandAll,
  collapseAll,
} = useTreeExpansion();
```

### Performance Best Practices

#### Large Files

1. **Check file size** before loading
2. **Build index** for files over threshold
3. **Load chunks** based on viewport
4. **Cache loaded chunks** to reduce I/O
5. **Use streaming** for sequential access

#### Virtualized UI

1. **Set appropriate item heights** for smooth rendering
2. **Use overscan** to prevent flickering
3. **Memoize render functions** to avoid re-renders
4. **Implement key extractors** for list identity
5. **Debounce scroll events** if needed

## Testing

### Manual Testing

#### Extension System

1. Navigate to Extensions panel in sidebar
2. Verify "Hello World Extension" is listed
3. Click Activate/Deactivate and verify state changes
4. Use search to filter extensions

#### Large File Handling

1. Create a large test file (>5MB)
2. Open the file in the editor
3. Verify only visible portions are loaded
4. Scroll through the file and verify smooth performance

#### Virtualized Components

1. Create a large file tree (1000+ files)
2. Open file explorer
3. Verify smooth scrolling
4. Expand/collapse folders and verify performance

### Automated Testing

Create test files in `server/tests/` and `client/tests/`:

```typescript
// Test extension loading
describe('ExtensionHost', () => {
  it('should load valid extension', async () => {
    const host = new ExtensionHost('./test-extensions');
    await host.initialize();
    const extensions = host.getExtensions();
    expect(extensions.length).toBeGreaterThan(0);
  });
});

// Test large file manager
describe('LargeFileManager', () => {
  it('should index large file', async () => {
    const manager = new LargeFileManager();
    await manager.buildLineIndex('test-file.txt');
    const stats = await manager.getFileStats('test-file.txt');
    expect(stats.indexed).toBe(true);
  });
});
```

## Integration

### Integrating Extensions into UI

The Extensions panel has been integrated into the sidebar alongside Files, Git, and Debug panels:

```typescript
<TabsTrigger value="extensions">
  <Package className="h-4 w-4 mr-2" />
  Extensions
</TabsTrigger>
```

### Using Large File Manager

In the editor component:

```typescript
const metadata = await fetch(`/api/files/metadata/${filePath}`).then(r => r.json());

if (metadata.useLargeFileHandling) {
  // Use chunked loading
  const chunk = await fetch(
    `/api/files/chunk/${filePath}?startLine=0&lineCount=1000`
  ).then(r => r.json());
  
  setContent(chunk.content);
} else {
  // Load entire file
  const content = await fetch(`/api/files/content/${filePath}`).then(r => r.text());
  setContent(content);
}
```

## Future Enhancements

### Extension System

- [ ] Extension marketplace integration
- [ ] Extension sandboxing for security
- [ ] WASM-based extensions
- [ ] Hot reload for extension development
- [ ] Extension dependency management
- [ ] Extension settings persistence
- [ ] Extension telemetry and diagnostics

### Performance

- [ ] Virtual scrolling for editor
- [ ] Incremental syntax highlighting
- [ ] Worker-based file indexing
- [ ] Caching layer for file chunks
- [ ] Compressed line index storage
- [ ] Memory usage monitoring and limits

## Troubleshooting

### Extension Not Loading

- Check extension manifest is valid JSON
- Verify `id`, `name`, and `version` fields are present
- Check server logs for error messages
- Ensure extension directory is in `extensions/` folder

### Extension Commands Not Working

- Verify command is registered in `contributes.commands`
- Check command ID matches in code and manifest
- Ensure extension is activated
- Look for errors in browser console

### Large File Performance Issues

- Verify file indexing is enabled
- Check chunk size configuration
- Monitor memory usage
- Ensure viewport calculations are correct

### Virtualized List Flickering

- Increase overscan value
- Verify item heights are consistent
- Check scroll event handling
- Ensure keys are stable

## API Reference

See inline documentation in source files:

- `shared/extension-types.ts` - Extension API types
- `server/extension-host.ts` - Extension host implementation
- `server/large-file-manager.ts` - Large file handling
- `client/src/components/VirtualizedTree.tsx` - Virtualized components

## Contributing

When adding Phase 3 features:

1. Add service implementation in `server/`
2. Create UI components in `client/src/components/`
3. Add API routes in `server/routes.ts`
4. Update type definitions in `shared/`
5. Add tests
6. Update this documentation

## License

MIT License - See LICENSE file for details
