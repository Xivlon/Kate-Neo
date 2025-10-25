# Kate Neo

A modern web-based IDE powered by KDE's KTextEditor framework, featuring native Kate integration through Node.js bindings. Combines a React frontend with Kate's powerful text editing engine, complete with debugging, Git integration, terminal, extensions, and comprehensive IDE features.

## Overview

Kate Neo successfully integrates the best of both worlds:
- **Modern Web-based UI**: React-based extensible IDE interface with Monaco Editor fallback
- **Powerful Text Editing**: KDE Kate's advanced text editing engine with native Node.js bindings (Phase 6 ✅)
- **Modular Architecture**: Clean separation between frontend, backend, native module, and services
- **Full IDE Features**: Debugging (DAP), Git integration, integrated terminal, extension system, settings, and i18n
- **Production Quality**: Comprehensive features across 6 completed development phases

**Key Achievement**: Successfully embedded KTextEditor framework in Node.js using N-API bindings, providing access to Kate's powerful editing engine with 300+ syntax definitions, all running headless for server deployment.

## Project Status

🚀 **Phase 6 Complete - Native Kate Integration Implemented** 🚀

Kate Neo has successfully completed native KTextEditor integration with full Node.js bindings. The foundation is established and working, with Kate's powerful text editing engine now available through a clean API. The IDE includes debugging, version control, terminal integration, extensions, settings management, and internationalization support.

**Current Phase**: Phase 7 - Advanced Features & Frontend Integration (Next)

## Repository Structure

```
Kate-Neo/
├── client/                          # React-based IDE frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── KateEditorPanel.tsx  # Kate integration component
│   │   │   ├── CodeEditor.tsx       # Main editor component
│   │   │   ├── DebugPanel.tsx       # Debug interface (DAP)
│   │   │   ├── SourceControlPanel.tsx # Git integration
│   │   │   ├── TerminalPanel.tsx    # Integrated terminal
│   │   │   ├── ExtensionsPanel.tsx  # Extension management
│   │   │   ├── SettingsPanel.tsx    # Settings UI
│   │   │   └── ...                  # Other UI components
│   │   ├── App.tsx                  # Main application component
│   │   └── main.tsx                 # Application entry point
│   ├── index.html
│   └── public/                      # Static assets
│
├── server/                          # Express backend server
│   ├── kate-bridge.ts               # Kate engine WebSocket bridge
│   ├── kate-service.ts              # Kate document management service
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API routes
│   └── vite.ts                      # Vite dev server setup
│
├── packages/
│   └── kate-native/                 # Native KTextEditor bindings (Phase 6)
│       ├── src/                     # C++ native module source
│       │   ├── addon.cpp            # N-API entry point
│       │   ├── qt_runner.cpp/h      # Qt event loop manager
│       │   ├── document_wrapper.cpp/h # KTextEditor::Document wrapper
│       │   └── editor_wrapper.cpp/h   # KTextEditor::Editor wrapper
│       ├── binding.gyp              # node-gyp build configuration
│       ├── index.js                 # JavaScript API
│       └── package.json
│
├── shared/                          # Shared types and interfaces
│   ├── kate-types.ts                # Kate engine type definitions
│   └── schema.ts                    # Database schema
│
├── docs/                            # Documentation
│   └── phase5/                      # Phase 5 research documents
│
├── scripts/                         # Build and utility scripts
│   ├── build.sh                     # Main build script
│   └── README.md                    # Scripts documentation
│
├── .github/
│   └── workflows/                   # CI/CD pipelines
│
├── package.json                     # Root package configuration
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** with submodule support

### Clone the Repository

```bash
git clone --recursive https://github.com/Xivlon/Kate-Neo.git
cd Kate-Neo
```

Or if already cloned:

```bash
git submodule update --init --recursive
```

### Installation

Install all dependencies:

```bash
npm install
```

This will install dependencies for both the client and server components.

### Running the Development Environment

Start the development server (runs both frontend and backend):

```bash
npm run dev
```

This command will:
- Start the Express backend server on port 5000
- Start the Vite development server for hot-reloading
- Serve the React frontend
- Enable WebSocket support for Kate bridge
- Initialize Kate native module (if available, otherwise falls back to Monaco)

The application will be available at `http://localhost:5000`

**Note**: The Kate native module requires Qt5/KF5 to be installed. See the [Native Module Setup](#native-module-setup) section below. The IDE works without it using Monaco Editor as a fallback.

### Building for Production

Build both client and server:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Development Commands

```bash
# Type checking
npm run check

# Database push (if using Drizzle ORM)
npm run db:push

# Build only
npm run build

# Build native Kate module (optional, for Kate integration)
cd packages/kate-native
npm install
npm run build
```

**Note**: Kate native module integration is complete but requires Qt5/KF5 runtime. The editor gracefully falls back to Monaco Editor when Kate is not available.

### Native Module Setup

The Kate native module (`@kate-neo/native`) provides access to KDE's KTextEditor framework for advanced text editing features. It's **optional** - the IDE works without it using Monaco Editor as a fallback.

#### System Requirements (for Kate integration)

**Linux (Recommended)**:
```bash
# Ubuntu/Debian
sudo apt-get install \
  qtbase5-dev qtchooser qt5-qmake qtbase5-dev-tools \
  extra-cmake-modules \
  libkf5texteditor-dev \
  libkf5syntaxhighlighting-dev \
  build-essential cmake pkg-config

# Fedora/RHEL
sudo dnf install qt5-qtbase-devel cmake extra-cmake-modules \
  kf5-ktexteditor-devel kf5-syntax-highlighting-devel gcc-c++
```

**macOS**:
```bash
# Via Homebrew
brew install qt@5 kde-mac/kde/ktexteditor
```

**Windows**:
Use WSL2 with Ubuntu and follow Linux instructions above.

#### Building the Native Module

```bash
cd packages/kate-native
npm install  # Automatically builds if dependencies are available
npm run build  # Or build manually
```

If the build fails (due to missing Qt/KF5), the IDE will still work with Monaco Editor.

For detailed information, see [packages/kate-native/README.md](packages/kate-native/README.md).

## Features

Kate Neo includes comprehensive IDE features across multiple development phases:

### Settings & Configuration (Phase 4)
- **Settings Manager**: Hierarchical settings with multi-scope support (Global, Workspace, Folder)
- **Settings Persistence**: Auto-save to JSON files with deep merging
- **Settings Panel**: Tabbed UI for Editor, Terminal, Git, Appearance, and Extensions settings
- **Scope Selector**: Switch between Global and Workspace settings
- **Reset Functionality**: Reset settings to defaults
- **Type-Safe Settings**: Full TypeScript support with comprehensive type definitions
- **Dot Notation Access**: Easy setting access via 'editor.fontSize' style keys

### Internationalization (Phase 4)
- **Multi-Language Support**: Currently supports English and Spanish
- **Translation Management**: Easy-to-update JSON translation files
- **Parameter Interpolation**: Dynamic values in translations (e.g., "File saved: {{name}}")
- **Locale Switching**: Change language on the fly from Settings panel
- **Fallback Mechanism**: Graceful fallback to default language for missing translations
- **React Hook**: useI18n hook for easy integration in components
- **API Endpoints**: Full REST API for locale and translation management

### Extension System (Phase 3)
- **Extension API**: Complete API for extending IDE functionality
- **Extension Host**: Manages extension lifecycle (load, activate, deactivate)
- **Extension Panel**: UI for viewing and managing installed extensions
- **Command Registry**: Register and execute custom commands
- **Contribution Points**: Extend menus, commands, languages, and more
- **Example Extensions**: Hello World extension demonstrates the API

### Performance Optimization (Phase 3)
- **Large File Handling**: Efficient handling of files over 5MB
- **Chunked Loading**: Load only visible portions of large files
- **Line Indexing**: Fast random access to any line in large files
- **Virtualized Components**: Efficient rendering for large datasets
- **Viewport Rendering**: Only render visible items in trees and lists
- **Memory Efficient**: Minimal memory footprint for large files

### Debugging (DAP Integration - Phase 2)
- **Debug Sessions**: Start, stop, pause, and continue debug sessions
- **Breakpoints**: Set and manage breakpoints in source files
- **Call Stack**: View the current call stack when paused
- **Variables**: Inspect variables in the current scope
- **Debug Panel**: Dedicated UI panel for all debugging features

### Version Control (Git - Phase 2)
- **File Status**: Track modified, added, deleted, and untracked files
- **Staging**: Stage and unstage files for commit
- **Commits**: Create commits with messages
- **Branches**: View, switch, and create branches
- **History**: View recent commit history
- **Source Control Panel**: Integrated Git UI in the sidebar

### Integrated Terminal (Phase 2)
- **Multiple Sessions**: Create and manage multiple terminal sessions
- **Real-time I/O**: WebSocket-based communication for instant response
- **Shell Support**: Automatic shell detection (bash, cmd, etc.)
- **Resizable Panel**: Collapsible terminal panel at the bottom

### Code Editor (Phase 1)
- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **File Explorer**: Browse and open files in your workspace
- **Tabbed Interface**: Multiple files open in tabs
- **Auto-save**: Save files with Ctrl+S
- **Find/Replace**: Search and replace across files

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│      React Frontend (Web Browser)       │
│  ┌─────────────────────────────────┐   │
│  │   KateEditorPanel Component     │   │
│  │   Monaco Editor (Fallback)      │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ WebSocket/HTTP
┌─────────────────▼──────────────────────┐
│     Express Backend (Node.js)           │
│  ┌─────────────────────────────────┐   │
│  │   Kate Bridge (WebSocket)       │   │  ✅ Implemented
│  │   Kate Service (Manager)        │   │  ✅ Implemented
│  │   REST API Routes               │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ N-API Native Binding
┌─────────────────▼──────────────────────┐
│   @kate-neo/native (C++ Module)         │  ✅ Phase 6 Complete
│  ┌─────────────────────────────────┐   │
│  │  Qt Event Loop Manager          │   │  ✅ Headless mode
│  │  Document Wrapper (N-API)       │   │  ✅ Working
│  │  Editor Wrapper                 │   │  ✅ Working
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ Qt/C++ API
┌─────────────────▼──────────────────────┐
│    KTextEditor Framework (KF5)          │  ✅ Integrated
│  ┌─────────────────────────────────┐   │
│  │  KTextEditor::Document (C++)    │   │  ✅ Available
│  │  Syntax Highlighting            │   │  ✅ 300+ languages
│  │  Code Folding, Search, Indent   │   │  🔄 Next phase
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Components

1. **Frontend (React + Monaco Editor)**
   - Web-based IDE interface built with React
   - Monaco editor provides current text editing with fallback support
   - `KateEditorPanel.tsx` - Component ready for full Kate integration
   - File explorer, tabs, and status bar
   - Debug, Source Control, Terminal, Extensions, and Settings panels
   - **Status**: ✅ Complete, ready for Phase 7 enhancements

2. **Backend Bridge (Express + WebSocket)**
   - `kate-bridge.ts` - ✅ WebSocket bridge for real-time Kate communication
   - `kate-service.ts` - ✅ Document lifecycle and buffer management
   - WebSocket server for real-time updates and event propagation
   - REST API for file operations and IDE features
   - **Status**: ✅ Implemented with full Kate integration support

3. **Native Module (`@kate-neo/native`)**
   - ✅ Node.js N-API bindings for KTextEditor framework
   - ✅ Qt event loop manager (headless mode, separate thread)
   - ✅ Document wrapper with full C++ to JavaScript API
   - ✅ Editor singleton wrapper for KTextEditor configuration
   - ✅ Cross-platform build system (node-gyp + pkg-config)
   - ✅ Graceful fallback when Qt/KF5 unavailable
   - **Status**: ✅ Phase 6 Complete - Foundation established

4. **Shared Types (`shared/kate-types.ts`)**
   - Type definitions for frontend ↔ backend communication
   - Protocol message types for Kate operations
   - Document metadata and buffer update structures
   - **Status**: ✅ Defined and implemented

5. **Kate Engine (KTextEditor Framework)**
   - KDE's KTextEditor framework (C++)
   - Advanced text buffer management
   - Sophisticated syntax highlighting (300+ languages)
   - Code folding and indentation support
   - Search and replace functionality
   - **Status**: ✅ Integrated via native bindings, advanced features in Phase 7

## Development Roadmap

### Phase 1: Project Setup ✅ COMPLETE
- [x] Create repository structure
- [x] Set up React frontend with Monaco Editor
- [x] Set up Express backend server
- [x] Add placeholder components for Kate integration
- [x] Create shared type definitions
- [x] Configure CI/CD workflows
- [x] Document architecture and setup

### Phase 2: Essential IDE Features ✅ COMPLETE
- [x] **Debugging System (DAP Integration)**
  - [x] Debug Adapter Protocol service implementation
  - [x] Debug session management (start, stop, pause, continue)
  - [x] Breakpoint management
  - [x] Debug panel UI with breakpoints, call stack, and variables view
  - [x] API endpoints for debug operations
- [x] **Version Control Integration (Git)**
  - [x] Git service with repository operations
  - [x] File status tracking (modified, added, deleted, untracked)
  - [x] Stage/unstage files
  - [x] Commit changes with message
  - [x] Branch management (list, switch, create)
  - [x] Commit history viewing
  - [x] Source control panel UI
- [x] **Terminal Integration**
  - [x] Terminal service with PTY support
  - [x] WebSocket-based terminal communication
  - [x] Multiple terminal sessions
  - [x] Terminal panel UI
  - [x] Input/output handling
  - [x] Session management

### Phase 3: Advanced Features & Polish ✅ COMPLETE
- [x] **Extension System**
  - [x] Extension API types and interfaces
  - [x] Extension manifest schema
  - [x] Extension host service implementation
  - [x] Extension loader and lifecycle management
  - [x] Extension API surface (workspace, languages, window, commands)
  - [x] Contribution points system
  - [x] Command registry and execution
  - [x] Example extension (Hello World)
  - [x] Extensions panel UI
  - [x] Extension enable/disable controls
  - [x] API endpoints for extension management
- [x] **Performance Optimization**
  - [x] Large file manager service
  - [x] Chunked file loading
  - [x] Line offset indexing for fast navigation
  - [x] Streaming file reading
  - [x] Virtualized tree component
  - [x] Virtualized list component
  - [x] Viewport-based rendering
  - [x] Tree expansion state management

### Phase 4: Production Ready ✅ COMPLETE
- [x] **Settings & Configuration**
  - [x] Settings Manager service with multi-scope support
  - [x] Settings type definitions and default values
  - [x] Settings persistence (global and workspace)
  - [x] Settings Panel UI component
  - [x] API endpoints for settings CRUD operations
  - [x] Scope selector (Global/Workspace)
  - [x] Reset to defaults functionality
  - [x] 5 setting categories (Editor, Terminal, Git, Appearance, Extensions)
- [x] **Internationalization (i18n)**
  - [x] I18n Service with multi-locale support
  - [x] Translation file management
  - [x] Parameter interpolation in translations
  - [x] Locale switching with events
  - [x] useI18n React hook
  - [x] Language selector UI component
  - [x] English and Spanish translations
  - [x] API endpoints for locale management
  - [x] Fallback mechanism for missing translations

### Phase 5: Kate Engine Research & Planning ✅ COMPLETE
- [x] Research KTextEditor framework architecture (13.8 KB documentation)
- [x] Investigate Node.js native binding options (20.2 KB documentation)
- [x] Explore Qt/KDE environment requirements (13.2 KB documentation)
- [x] Define Kate ↔ Node.js communication protocol (17.4 KB documentation)
- [x] Create proof-of-concept for Kate embedding (19.7 KB documentation)
- [x] Document technical decisions and trade-offs (19.5 KB documentation)
- [x] Complete implementation guide (15.6 KB)
- [x] **Total**: 119 KB comprehensive documentation
- [x] Working POC with performance benchmarks
- [x] Technical architecture defined

### Phase 6: Native Binding Implementation ✅ COMPLETE
- [x] Set up development environment structure
- [x] Implement core native module (@kate-neo/native)
  - [x] Qt event loop manager (headless mode)
  - [x] KTextEditor::Editor wrapper
  - [x] KTextEditor::Document wrapper
  - [x] N-API bindings with node-addon-api
  - [x] Cross-platform build system (node-gyp + pkg-config)
- [x] Create WebSocket bridge service integration
- [x] Integrate with backend server (kate-service.ts)
- [x] Implement basic buffer management with Kate
- [x] Set up Qt/KDE runtime environment (headless mode)
- [x] Implement document operations API
- [x] Create fallback mode for systems without KTextEditor
- [x] Documentation (README, implementation guide, summary)
- [x] Basic testing and validation
- [x] **Deliverables**: 18 new files, ~2,500 lines of code/docs

### Phase 7: Advanced Features & Integration 🔄 IN PROGRESS (Next)
- [ ] **Syntax & Highlighting Integration**
  - [ ] Extract syntax tokens from Kate engine
  - [ ] Bridge tokens to Monaco/frontend format
  - [ ] Real-time highlighting updates
  - [ ] Support for 300+ language definitions
- [ ] **Code Folding Integration**
  - [ ] Detect folding regions from Kate
  - [ ] UI integration for folding controls
  - [ ] Fold/unfold operations via Kate API
- [ ] **Event System**
  - [ ] Kate → JavaScript event propagation
  - [ ] Document change events
  - [ ] Cursor position events
  - [ ] Selection change events
- [ ] **Frontend Updates**
  - [ ] WebSocket client for Kate communication
  - [ ] Real-time buffer synchronization
  - [ ] Performance optimization for updates
- [ ] **Testing & Validation**
  - [ ] Comprehensive integration tests
  - [ ] Performance benchmarks
  - [ ] Cross-platform testing

### Phase 8: Core Features Completion (Future)
- [ ] **Advanced Editing Features**
  - [ ] Bidirectional buffer synchronization
  - [ ] Smart indentation from Kate
  - [ ] Advanced search and replace
  - [ ] Multi-cursor support
  - [ ] Kate session management
- [ ] **LSP Integration**
  - [ ] Language server protocol support
  - [ ] Code completion
  - [ ] Go to definition
  - [ ] Find references
  - [ ] Diagnostics and errors

### Phase 9: Polish & Release (Future)
- [ ] Complete user documentation
- [ ] API documentation
- [ ] Example configurations and templates
- [ ] Performance optimization at scale
- [ ] Comprehensive E2E testing
- [ ] Package for distribution (npm, standalone binaries)
- [ ] Release version 1.0

## Kate Engine Integration Status

The Kate engine integration is now functional through native Node.js bindings. Here's the current implementation status:

### Native Module (`@kate-neo/native`) - ✅ Phase 6 Complete

**Implemented**:
- ✅ Qt event loop manager (headless QCoreApplication, separate thread)
- ✅ KTextEditor::Editor wrapper (singleton access)
- ✅ KTextEditor::Document wrapper with full API
- ✅ N-API bindings using node-addon-api
- ✅ Cross-platform build configuration (node-gyp)
- ✅ Graceful fallback mode when KTextEditor unavailable
- ✅ Basic document operations (create, setText, getText, line access)
- ✅ Syntax mode management (300+ language definitions)

**Phase 7 Priorities** (Next):
- [ ] Syntax token extraction and bridge to frontend
- [ ] Code folding region detection and API
- [ ] Event system (Kate → JavaScript via callbacks)
- [ ] Advanced search and replace functionality
- [ ] Incremental buffer updates and synchronization
- [ ] Performance optimizations for large files

### Backend Service (`server/kate-service.ts`) - ✅ Implemented

**Complete**:
- ✅ Document lifecycle management (create, open, close)
- ✅ Buffer operations and updates
- ✅ Integration with native module
- ✅ Fallback implementations for Monaco editor
- ✅ Error handling and validation

### WebSocket Bridge (`server/kate-bridge.ts`) - ✅ Integrated

**Complete**:
- ✅ Real-time communication protocol
- ✅ Kate availability status reporting
- ✅ Document operation routing to KateService
- ✅ Enhanced error handling and logging

### Frontend (`client/src/components/KateEditorPanel.tsx`) - 🔄 Ready for Phase 7

**Phase 7 Tasks**:
- [ ] Update WebSocket client for Kate communication
- [ ] Implement syntax token rendering from Kate
- [ ] Add code folding UI integration
- [ ] Handle real-time Kate events
- [ ] Performance optimizations for Kate updates

## Contributing

Contributions are welcome! This project is in early stages, and there are many opportunities to contribute.

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Current Priority Areas

1. **Phase 7: Advanced Kate Features** (Immediate Priority)
   - Implement syntax token extraction from Kate engine
   - Add code folding region detection
   - Create event propagation system (Kate → JavaScript)
   - Update frontend for full Kate integration
   - Files: `packages/kate-native/src/`, `client/src/components/KateEditorPanel.tsx`

2. **Frontend Kate Integration**
   - WebSocket client for real-time Kate communication
   - Render syntax tokens from Kate in Monaco/custom editor
   - Handle Kate events (document changes, cursor, selection)
   - Performance optimization for large documents
   - Files: `client/src/components/`, `client/src/services/`

3. **Testing Infrastructure**
   - Integration tests for native module
   - End-to-end tests for Kate features
   - Performance benchmarks
   - Cross-platform testing (Linux, macOS, Windows/WSL2)
   - Files: `packages/kate-native/test/`, `tests/`

4. **Documentation**
   - User guide for Kate features
   - API reference for native module
   - Contributing guide for native development
   - Troubleshooting guide for Qt/KF5 setup
   - Files: `docs/`, various README files

5. **Performance & Polish**
   - Optimize buffer synchronization
   - Reduce WebSocket message overhead
   - Improve large file handling
   - Memory profiling and optimization
   - Files: Throughout codebase

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Add TODO comments for any deferred work
5. Update documentation as needed
6. Ensure the build passes: `npm run build`
7. Run type checking: `npm run check`
8. Push to your branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines

- **Follow existing patterns**: Maintain consistency with current code structure
- **Add TODO comments**: Mark integration points and future work clearly
- **Document Kate integration**: All Kate engine touchpoints should be documented
- **Write clear commit messages**: Use conventional commit format
- **Update documentation**: Keep README and inline docs up to date
- **Test your changes**: Ensure builds pass before submitting PR
- **TypeScript**: Use proper types, avoid `any` when possible

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments to exported functions and types
- Use meaningful variable names
- Keep functions focused and single-purpose

## Submodules

This project may use Git submodules for certain dependencies. After cloning, initialize submodules with:

```bash
git submodule update --init --recursive
```

To update submodules to latest versions:

```bash
git submodule update --remote --recursive
```

## Resources

### Project Documentation
- Main codebase documentation in source files
- [CONTRIBUTING.md](CONTRIBUTING.md) - Detailed contribution guidelines
- [Scripts README](scripts/README.md) - Build and deployment scripts
- **Phase 5 Documentation** (Research & Planning):
  - [KTextEditor Architecture](docs/phase5/1-ktexteditor-architecture.md)
  - [Node.js Native Bindings](docs/phase5/2-nodejs-native-bindings.md)
  - [Qt/KDE Requirements](docs/phase5/3-qt-kde-requirements.md)
  - [Communication Protocol](docs/phase5/4-communication-protocol.md)
  - [Proof of Concept](docs/phase5/5-proof-of-concept.md)
  - [Technical Decisions](docs/phase5/6-technical-decisions.md)
  - [Implementation Guide](docs/phase5/IMPLEMENTATION_GUIDE.md)
- **Phase 6 Documentation** (Native Binding Implementation):
  - [Native Module README](packages/kate-native/README.md)
  - [PHASE6_IMPLEMENTATION.md](PHASE6_IMPLEMENTATION.md)
  - [PHASE6_SUMMARY.md](PHASE6_SUMMARY.md)

### External Resources
- [Kate Editor](https://kate-editor.org/) - KDE Advanced Text Editor
- [KTextEditor Framework](https://api.kde.org/frameworks/ktexteditor/html/) - Kate's underlying framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Current editor (fallback)
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [TypeScript](https://www.typescriptlang.org/) - Primary language
- [Vite](https://vitejs.dev/) - Build tool and dev server

### Useful Documentation for Kate Integration
- [KDE API Documentation](https://api.kde.org/)
- [Qt Documentation](https://doc.qt.io/) - Required for KTextEditor
- [Node.js N-API](https://nodejs.org/api/n-api.html) - For native bindings
- [node-addon-api](https://github.com/nodejs/node-addon-api) - C++ wrapper for N-API (currently used)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note:** This project integrates with Eclipse Theia (EPL-2.0) and KDE Kate (LGPL-2.0+). When distributing this software, you must comply with all applicable licenses.

## Acknowledgments

- **Eclipse Theia** team for the amazing IDE framework
- **KDE Kate** team for the powerful text editor engine
- All contributors to this project

## Contact

- **Issues**: [GitHub Issues](https://github.com/Xivlon/Kate-Neo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Xivlon/Kate-Neo/discussions)

---

**Current Status**: Phase 6 Complete - Native Kate integration established with working bindings. Phase 7 (Advanced Features) in progress. The IDE is functional with debugging, Git, terminal, extensions, settings, and i18n support. Kate engine provides advanced text editing capabilities with graceful Monaco fallback.
