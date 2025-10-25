# @kate-neo/native

Native Node.js bindings for the KDE KTextEditor framework.

## Overview

This package provides Node.js bindings to the KTextEditor framework, enabling Kate's powerful text editing capabilities to be used in Node.js applications.

## Features

- **Document Management**: Create and manipulate text documents
- **Syntax Highlighting**: Support for 300+ programming languages
- **Smart Editing**: Intelligent indentation and code folding
- **File Operations**: Open, save, and manage files
- **Undo/Redo**: Full undo/redo support

## Requirements

### Linux (Primary Platform)

```bash
# Ubuntu/Debian 20.04+
sudo apt-get install \
  qtbase5-dev \
  qtchooser \
  qt5-qmake \
  qtbase5-dev-tools \
  extra-cmake-modules \
  libkf5texteditor-dev \
  libkf5syntaxhighlighting-dev \
  build-essential \
  cmake \
  pkg-config

# For Ubuntu 18.04 and earlier:
# Replace qtbase5-dev qtchooser qt5-qmake qtbase5-dev-tools
# with qt5-default qtbase5-dev

# Fedora/RHEL
sudo dnf install \
  qt5-qtbase-devel \
  extra-cmake-modules \
  kf5-ktexteditor-devel \
  kf5-syntax-highlighting-devel
```

### macOS

```bash
# Using Homebrew
brew install qt@5 kde-mac/kde/ktexteditor
```

### Windows

WSL2 with Ubuntu is recommended. Native Windows support is experimental.

## Installation

```bash
npm install @kate-neo/native
```

## Usage

### Basic Example

```javascript
const kate = require('@kate-neo/native');

// Check if Kate is available
if (!kate.isKateAvailable()) {
  console.log('KTextEditor not available');
  process.exit(1);
}

// Create a document
const doc = kate.createDocument();

// Set content
doc.setText('Hello, World!\nThis is Kate.');

// Get content
console.log('Text:', doc.getText());
console.log('Line count:', doc.lineCount());
console.log('Line 0:', doc.line(0));

// Set syntax mode
doc.setMode('JavaScript');
console.log('Mode:', doc.mode());

// Insert text
doc.insertText(1, 0, 'New line\n');

// File operations
doc.openUrl('/path/to/file.js');
console.log('Current file:', doc.url());
doc.saveUrl();
```

### API Reference

#### Module Functions

- `isKateAvailable()`: Returns true if KTextEditor is available
- `isQtRunning()`: Returns true if Qt event loop is running
- `getStatus()`: Returns module status information
- `createDocument()`: Creates a new KTextEditor document
- `getEditor()`: Returns the Kate editor singleton

#### KateDocument Class

**Text Operations**
- `getText()`: Get full document text
- `setText(text)`: Set document text
- `line(lineNum)`: Get text of specific line
- `insertText(line, column, text)`: Insert text at position
- `removeText(startLine, startCol, endLine, endCol)`: Remove text range

**Properties**
- `lineCount()`: Get number of lines
- `length()`: Get total text length
- `isModified()`: Check if document has unsaved changes

**Syntax Highlighting**
- `mode()`: Get current syntax mode
- `setMode(mode)`: Set syntax mode (e.g., 'JavaScript', 'Python')
- `modes()`: Get list of available syntax modes

**File Operations**
- `openUrl(path)`: Open file from path
- `saveUrl()`: Save current document
- `url()`: Get current file path

**Editing**
- `undo()`: Undo last change
- `redo()`: Redo last undone change

#### KateEditor Class

- `version()`: Get Kate version
- `applicationName()`: Get application name
- `availableModes()`: Get all available syntax modes

## Fallback Mode

If KTextEditor is not available, the module runs in fallback mode with mock implementations. All API calls will work but won't have actual functionality. Check `isKateAvailable()` to detect this.

## Building from Source

```bash
# Install dependencies
npm install

# Build native module
npm run build

# Rebuild (clean + build)
npm run rebuild
```

## Environment Variables

- `QT_QPA_PLATFORM=offscreen`: Run Qt headless (no display server needed)
- `CMAKE_PREFIX_PATH`: Path to CMake configs (if not in standard location)

## Troubleshooting

### "Kate native module not available"

The native module failed to load. Ensure all dependencies are installed:

```bash
pkg-config --exists Qt5Core && echo "✓ Qt5Core"
pkg-config --exists KF5TextEditor && echo "✓ KF5TextEditor"
```

### Build Errors

1. Check that Qt5 and KF5 are installed
2. Verify pkg-config can find them: `pkg-config --cflags KF5TextEditor`
3. Install build tools: `sudo apt-get install build-essential cmake`

### Runtime Errors

If Qt complains about missing platform plugin:
```bash
export QT_QPA_PLATFORM=offscreen
```

## Architecture

The module uses:
- **node-addon-api**: Modern C++ wrapper for N-API
- **Qt5/KF5**: KTextEditor framework
- **Headless Qt**: QCoreApplication (no GUI required)
- **Thread Safety**: Qt runs in separate thread

## License

MIT License - See LICENSE file

## Contributing

Contributions welcome! See CONTRIBUTING.md for guidelines.

## Related Links

- [KTextEditor Documentation](https://api.kde.org/frameworks/ktexteditor/html/)
- [Kate Editor](https://kate-editor.org/)
- [node-addon-api](https://github.com/nodejs/node-addon-api)
