# KTextEditor Framework Architecture Research

## Overview

KTextEditor is KDE's advanced text editing framework that powers Kate, KWrite, and other KDE applications. It provides a comprehensive set of features for text editing, syntax highlighting, code completion, and more.

## Architecture Components

### 1. Core Components

#### KTextEditor::Editor
- **Role**: Singleton interface to the editor component
- **Responsibilities**:
  - Managing global editor settings
  - Creating document and view instances
  - Plugin management
  - Command registration
- **Key Methods**:
  - `createDocument()` - Creates new document instances
  - `createView()` - Creates view for a document
  - `plugins()` - Returns list of available plugins

#### KTextEditor::Document
- **Role**: Represents the text buffer and document model
- **Responsibilities**:
  - Text storage and manipulation
  - Undo/redo management
  - Syntax highlighting
  - Search and replace
  - Encoding management
  - Modified state tracking
- **Key Signals**:
  - `textChanged()` - Emitted when text is modified
  - `textInserted()` - Emitted when text is inserted
  - `textRemoved()` - Emitted when text is removed
  - `modeChanged()` - Emitted when syntax mode changes
- **Key Methods**:
  - `text()` - Get entire document text
  - `line(int)` - Get text of specific line
  - `setText()` - Replace entire document
  - `insertText()` - Insert text at position
  - `removeText()` - Remove text range
  - `setHighlightingMode()` - Set syntax highlighting mode

#### KTextEditor::View
- **Role**: Visual representation of a document
- **Responsibilities**:
  - Rendering text with syntax highlighting
  - Cursor management
  - Selection handling
  - Scrolling and viewport management
  - User input handling
- **Key Features**:
  - Multiple views per document
  - Independent cursor positions
  - Code folding UI
  - Line numbers
  - Minimap
- **Key Methods**:
  - `cursorPosition()` - Get current cursor position
  - `setCursorPosition()` - Move cursor
  - `selection()` - Get current selection
  - `setSelection()` - Set selection range

#### KTextEditor::Range
- **Role**: Represents a text range in the document
- **Structure**:
  ```cpp
  class Range {
      Cursor start;  // Start position (inclusive)
      Cursor end;    // End position (exclusive)
  }
  ```
- **Usage**: All text operations use Range for specifying locations

#### KTextEditor::Cursor
- **Role**: Represents a position in the document
- **Structure**:
  ```cpp
  class Cursor {
      int line;      // Line number (0-based)
      int column;    // Column number (0-based)
  }
  ```

### 2. Syntax Highlighting System

#### Architecture
- **Parser**: Uses external syntax definition files (XML-based)
- **Highlighting Modes**: 300+ built-in language definitions
- **Format Files**: Located in `/usr/share/org.kde.syntax-highlighting/syntax/`
- **Themes**: Customizable color schemes

#### Key Classes
- **KSyntaxHighlighting::Repository**: Manages syntax definitions
- **KSyntaxHighlighting::Definition**: Represents a syntax definition
- **KSyntaxHighlighting::Theme**: Color scheme for highlighting
- **KSyntaxHighlighting::State**: Parsing state for incremental highlighting

#### Incremental Highlighting
- Line-based highlighting for performance
- State preservation for multi-line constructs
- Asynchronous highlighting for large files

### 3. Code Folding

- **Indentation-based folding**: Automatic based on indentation
- **Syntax-based folding**: Based on language structure (functions, classes, etc.)
- **Region markers**: Custom folding regions with markers
- **Persistent state**: Folding state can be saved/restored

### 4. Editing Features

#### Smart Indentation
- Language-aware indentation
- Automatic indentation on newline
- Tab/space conversion
- Customizable indentation rules per language

#### Auto-completion
- Word completion from document
- Plugin-based completion (LSP, etc.)
- Template completion
- Abbreviation expansion

#### Multi-Cursor Support
- Multiple independent cursors
- Synchronized editing
- Column selection mode

### 5. Plugin System

#### Plugin Types
- **Application Plugins**: Extend the entire editor
- **Document Plugins**: Per-document functionality
- **View Plugins**: Per-view UI extensions

#### Plugin Architecture
- **KTextEditor::Plugin**: Base class for plugins
- **KTextEditor::ConfigPage**: Plugin configuration interface
- **KTextEditor::Command**: Registerable commands

#### Built-in Plugins
- Code snippets
- Auto-brace completion
- Search/replace
- External tools integration
- LSP client (Language Server Protocol)

## Document Model

### Text Storage
- **Line-based storage**: Optimized for line operations
- **Gap buffer**: Efficient for insertions/deletions
- **UTF-8 encoding**: Native Unicode support
- **Line endings**: Auto-detection and conversion (LF, CRLF, CR)

### Document State
- **Undo/Redo Stack**: Complete history with grouping
- **Modified State**: Track changes since last save
- **Bookmarks**: Named positions in document
- **Marks**: Various marker types for annotations

### Cursors and Selections
- **Moving Cursors**: Update automatically with text changes
- **Smart Cursors**: Maintain positions across edits
- **Multiple Selections**: Support for non-contiguous selections

## View System

### Rendering Pipeline
1. **Text Layout**: Calculate line layouts and wrapping
2. **Syntax Highlighting**: Apply color tokens
3. **Decorations**: Add fold markers, bookmarks, etc.
4. **Line Numbers**: Render line number column
5. **Minimap**: Generate miniature overview

### View Configuration
- **Font Settings**: Font family, size, styling
- **Display Options**: Line numbers, fold markers, whitespace
- **Word Wrap**: Soft wrapping configuration
- **Dynamic Word Wrap**: Auto-adjust wrap column
- **Scroll Synchronization**: Multiple views can be synced

## Integration Points

### Qt Integration
- **QWidget-based**: Views are Qt widgets
- **Signal/Slot**: Event communication via Qt signals
- **Event Loop**: Integrates with Qt event loop
- **Layouts**: Can be embedded in Qt layouts

### KDE Integration
- **KConfig**: Settings persistence
- **KXMLGUIClient**: Menu and toolbar integration
- **KIO**: File loading/saving with network support
- **KParts**: Can be embedded as KPart component

### File System
- **Local Files**: Direct file access
- **Network Files**: Via KIO (ftp, sftp, http, etc.)
- **Auto-reload**: Detect external changes
- **File Locking**: Prevent concurrent modifications

## Configuration System

### Settings Hierarchy
1. **Global Settings**: System-wide defaults
2. **Application Settings**: Per-application configuration
3. **Document Settings**: Per-document overrides
4. **Session Settings**: Current session state

### Configuration Storage
- **KConfig Files**: INI-style configuration
- **Location**: `~/.config/katepartrc`, `~/.config/katesyntaxhighlightingrc`
- **Schema Validation**: Type-safe configuration access

### Configurable Aspects
- Editor appearance (fonts, colors, spacing)
- Editing behavior (indentation, auto-completion)
- View options (line numbers, minimap, fold markers)
- Syntax highlighting themes
- Keyboard shortcuts

## Performance Characteristics

### Strengths
- **Line-based operations**: O(1) access to any line
- **Incremental highlighting**: Only re-highlight changed regions
- **Lazy loading**: Large files loaded on-demand
- **View separation**: Multiple views share document data

### Optimization Techniques
- **Smart repaint**: Only redraw changed regions
- **Text caching**: Cache rendered text layouts
- **Async operations**: Background syntax analysis
- **Memory mapping**: Large files use mmap

### Scalability
- **Large Files**: Can handle files up to several GB
- **Many Documents**: Efficient multi-document management
- **Long Lines**: Handles very long lines gracefully
- **Deep Nesting**: Efficient syntax state management

## API Versioning

### Current Version
- **KTextEditor 5.x**: KDE Frameworks 5 version
- **KTextEditor 6.x**: KDE Frameworks 6 version (Qt 6)

### API Stability
- **Binary Compatibility**: Maintained within major versions
- **Source Compatibility**: Generally maintained
- **Deprecation Policy**: Features marked deprecated before removal

### Version Detection
```cpp
#include <KTextEditor/Editor>

QString version = KTextEditor::Editor::instance()->version();
```

## Dependencies

### Required Libraries
- **Qt Core**: Core Qt functionality (5.15+ or 6.0+)
- **Qt GUI**: GUI components
- **Qt Widgets**: Widget classes
- **KF5/KF6 CoreAddons**: KDE core utilities
- **KF5/KF6 I18n**: Internationalization
- **KF5/KF6 Parts**: KParts framework
- **KF5/KF6 SyntaxHighlighting**: Syntax highlighting library

### Optional Dependencies
- **KF5/KF6 TextWidgets**: Additional text widgets
- **KF5/KF6 Completion**: Enhanced completion
- **KF5/KF6 IconThemes**: Icon theme support

## Thread Safety

### Thread-Safe Components
- **Repository**: Syntax definition loading
- **Highlighting Engine**: Can run in background threads

### Thread-Unsafe Components
- **Document**: Must be accessed from main thread only
- **View**: Qt widgets are not thread-safe
- **Editor**: Singleton must be accessed from main thread

### Threading Recommendations
- Use signals/slots for cross-thread communication
- Perform heavy operations in worker threads
- Use Qt::QueuedConnection for cross-thread signals
- Document modifications must be queued to main thread

## Memory Management

### Object Ownership
- **Documents**: Managed by Editor instance
- **Views**: Owned by parent widget
- **Cursors**: Reference-counted smart pointers
- **Ranges**: Value objects (can be copied)

### Cleanup
- Documents deleted when last reference removed
- Views deleted when widget destroyed
- Automatic cleanup on application exit
- Manual cleanup via `delete` or smart pointers

## Example Usage Patterns

### Creating and Using a Document
```cpp
#include <KTextEditor/Editor>
#include <KTextEditor/Document>
#include <KTextEditor/View>

// Get editor instance
KTextEditor::Editor* editor = KTextEditor::Editor::instance();

// Create document
KTextEditor::Document* doc = editor->createDocument(nullptr);

// Set content
doc->setText("Hello, World!\n");

// Set syntax highlighting
doc->setHighlightingMode("C++");

// Create view
KTextEditor::View* view = doc->createView(parentWidget);

// Show view
view->show();
```

### Handling Text Changes
```cpp
// Connect to text changed signal
connect(doc, &KTextEditor::Document::textChanged,
        this, &MyClass::onTextChanged);

void MyClass::onTextChanged(KTextEditor::Document* doc) {
    // Get current text
    QString text = doc->text();
    
    // Process changes
    processText(text);
}
```

### Working with Cursors and Ranges
```cpp
// Get cursor position
KTextEditor::Cursor cursor = view->cursorPosition();

// Create a range
KTextEditor::Range range(cursor, KTextEditor::Cursor(cursor.line(), cursor.column() + 5));

// Get text in range
QString text = doc->text(range);

// Replace text
doc->replaceText(range, "new text");
```

## Integration Challenges for Node.js

### Challenge 1: C++ to JavaScript Bridge
- **Issue**: KTextEditor is pure C++, Node.js is JavaScript
- **Solution Options**:
  - N-API native addons
  - node-addon-api (C++ wrapper)
  - SWIG bindings generator
  - Custom FFI layer

### Challenge 2: Qt Event Loop
- **Issue**: KTextEditor requires Qt event loop
- **Solution Options**:
  - Run Qt in separate thread
  - Integrate Qt event loop with Node.js event loop
  - Use Qt QCoreApplication without GUI

### Challenge 3: Widget System
- **Issue**: Views are Qt widgets (QWidget)
- **Solution Options**:
  - Headless mode (document-only)
  - Offscreen rendering
  - Embed in Electron/WebView
  - Use document API only, custom renderer

### Challenge 4: Signal/Slot Communication
- **Issue**: Qt signals need to cross language boundary
- **Solution Options**:
  - Event emitter pattern in JavaScript
  - Callback registration system
  - Message queue for async communication

### Challenge 5: Memory Management
- **Issue**: Different memory models (GC vs manual)
- **Solution Options**:
  - Reference counting in bindings
  - Finalizers for cleanup
  - Smart pointers on C++ side
  - Explicit lifecycle management

## Recommended Integration Approach

### Option 1: Full Binding (Complex, Full-Featured)
- Create N-API bindings for KTextEditor classes
- Wrap Document, View, Cursor, Range
- Translate Qt signals to Node.js events
- Requires Qt integration

### Option 2: Document-Only (Simpler, Limited)
- Only bind Document class
- Headless mode (no views)
- Text operations only
- Custom UI in web frontend
- No Qt GUI dependency

### Option 3: Bridge Process (Isolated, Robust)
- Run KTextEditor in separate process
- IPC communication (pipes, sockets)
- Protobuf/JSON messages
- Better isolation, easier debugging
- Higher latency

### Option 4: Hybrid (Recommended)
- Document operations via native binding
- Syntax highlighting via separate library
- Custom rendering in web frontend
- Minimal Qt dependencies
- Balance of features and complexity

## Further Reading

- [KTextEditor API Documentation](https://api.kde.org/frameworks/ktexteditor/html/)
- [Kate Handbook](https://docs.kde.org/trunk5/en/kate/kate/kate.pdf)
- [KDE Frameworks Documentation](https://api.kde.org/frameworks/)
- [Qt Documentation](https://doc.qt.io/)
- [Syntax Highlighting Framework](https://api.kde.org/frameworks/syntax-highlighting/html/)

## Next Steps

1. Set up KDE development environment
2. Build simple KTextEditor example application
3. Test document operations and event handling
4. Prototype N-API bindings for basic operations
5. Evaluate performance and memory characteristics
6. Design communication protocol for Kate ↔ Node.js
