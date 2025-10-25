# Kate Neo

A hybrid IDE combining the modern [Eclipse Theia](https://theia-ide.org/) frontend with the powerful [Kate](https://kate-editor.org/) text editor engine.

## Overview

Kate Neo aims to provide the best of both worlds:
- **Modern Web-based UI**: Eclipse Theia's extensible, web-based IDE interface
- **Powerful Text Editing**: KDE Kate's advanced text editing engine with sophisticated features
- **Modular Architecture**: Clean separation between frontend, backend, and scripts

## Project Status

🚧 **This project is currently in the initial setup phase** 🚧

The repository structure has been established with placeholder implementations and comprehensive TODO markers indicating where Kate engine integration is needed.

## Repository Structure

```
Kate-Neo/
├── client/                          # React-based IDE frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── KateEditorPanel.tsx  # Placeholder for Kate integration
│   │   │   ├── CodeEditor.tsx       # Main editor component
│   │   │   └── ...                  # Other UI components
│   │   ├── App.tsx                  # Main application component
│   │   └── main.tsx                 # Application entry point
│   ├── index.html
│   └── public/                      # Static assets
│
├── server/                          # Express backend server
│   ├── kate-bridge.ts               # Kate engine bridge (placeholder)
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # API routes
│   └── vite.ts                      # Vite dev server setup
│
├── shared/                          # Shared types and interfaces
│   ├── kate-types.ts                # Kate engine type definitions
│   └── schema.ts                    # Database schema
│
├── scripts/                         # Build and utility scripts
│   ├── build.sh                     # Main build script
│   └── README.md                    # Scripts documentation
│
├── .github/
│   └── workflows/                   # CI/CD pipelines
│       ├── frontend-build.yml
│       └── backend-build.yml
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
- Enable WebSocket support for Kate bridge (placeholder)

The application will be available at `http://localhost:5000`

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
```

**Note**: Kate engine integration is currently in placeholder mode. The editor uses Monaco Editor until the Kate engine bridge is fully implemented.

## Features

Kate Neo includes comprehensive IDE features across multiple development phases:

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
│  │   KateEditorPanel (Placeholder) │   │  TODO: Kate integration
│  │   Monaco Editor (Current)        │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ WebSocket/HTTP
┌─────────────────▼──────────────────────┐
│     Express Backend (Node.js)           │
│  ┌─────────────────────────────────┐   │
│  │   Kate Bridge (Placeholder)     │   │  TODO: WebSocket handler
│  │   REST API Routes               │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ Native Binding
┌─────────────────▼──────────────────────┐
│        Kate Text Editor Engine          │  TODO: To be integrated
│  ┌─────────────────────────────────┐   │
│  │  KTextEditor Framework (C++)    │   │
│  │  Buffer, Syntax, Indent, Search │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Components

1. **Frontend (React + Monaco Editor)**
   - Web-based IDE interface built with React
   - Monaco editor for current text editing (placeholder for Kate)
   - `KateEditorPanel.tsx` - Placeholder component for Kate integration
   - File explorer, tabs, and status bar
   - **TODO**: Replace Monaco with Kate engine integration

2. **Backend Bridge (Express + WebSocket)**
   - `kate-bridge.ts` - Placeholder for Kate engine communication
   - WebSocket server for real-time updates
   - REST API for file operations
   - **TODO**: Implement native bindings to KTextEditor framework
   - **TODO**: Add buffer synchronization protocol
   - **TODO**: Translate Kate syntax highlighting to Monaco format

3. **Shared Types (`shared/kate-types.ts`)**
   - Type definitions for frontend ↔ backend communication
   - Protocol message types
   - Document metadata and buffer update structures
   - **TODO**: Expand as Kate integration progresses

4. **Kate Engine** (To be integrated)
   - KDE's KTextEditor framework (C++)
   - Advanced text buffer management
   - Sophisticated syntax highlighting
   - Code folding and indentation
   - Search and replace
   - **TODO**: Research embedding options (QML, native Node.js bindings)
   - **TODO**: Create bridge between Node.js and Qt/KDE environment

## Development Roadmap

### Phase 1: Project Setup ✅ (Completed)
- [x] Create repository structure
- [x] Set up React frontend with Monaco Editor
- [x] Set up Express backend server
- [x] Add placeholder components for Kate integration
- [x] Create shared type definitions
- [x] Configure CI/CD workflows
- [x] Document architecture and setup

### Phase 2: Essential IDE Features ✅ (Completed)
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

### Phase 3: Advanced Features & Polish ✅ (Completed)
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

### Phase 4: Kate Engine Research & Planning (Next)
- [ ] **TODO**: Research KTextEditor framework architecture
- [ ] **TODO**: Investigate Node.js native binding options (N-API, node-addon-api)
- [ ] **TODO**: Explore Qt/KDE environment requirements
- [ ] **TODO**: Define Kate ↔ Node.js communication protocol
- [ ] **TODO**: Create proof-of-concept for Kate embedding
- [ ] **TODO**: Document technical decisions and trade-offs

### Phase 5: Kate Engine Integration (Future)
- [ ] **TODO**: Create native Node.js bindings for KTextEditor
- [ ] **TODO**: Implement basic buffer management with Kate
- [ ] **TODO**: Set up Qt/KDE runtime environment
- [ ] **TODO**: Test Kate engine initialization and basic operations
- [ ] **TODO**: Implement WebSocket communication for buffer sync

### Phase 6: Core Features (Future)
- [ ] **TODO**: Implement bidirectional buffer synchronization
- [ ] **TODO**: Bridge Kate syntax highlighting to Monaco tokenizer
- [ ] **TODO**: Add code folding integration
- [ ] **TODO**: Integrate smart indentation from Kate
- [ ] **TODO**: Implement search and replace functionality
- [ ] **TODO**: Add Kate session management

### Phase 6: Advanced Features (Future)
- [ ] **TODO**: Multi-cursor support
- [ ] **TODO**: Language-specific features (LSP integration)
- [ ] **TODO**: Custom UI components for Kate features
- [ ] **TODO**: Performance optimization for large files
- [ ] **TODO**: Comprehensive testing (unit, integration, e2e)
- [ ] **TODO**: Error handling and recovery mechanisms

### Phase 7: Polish & Release (Future)
- [ ] **TODO**: Complete user documentation
- [ ] **TODO**: API documentation
- [ ] **TODO**: Example configurations and templates
- [ ] **TODO**: Package for distribution (npm, standalone)
- [ ] **TODO**: Release version 1.0

## Kate Engine Integration Points

Throughout the codebase, you'll find TODO comments marking where Kate engine integration is needed:

### Frontend (`client/src/components/KateEditorPanel.tsx`)
- `TODO: Initialize connection to Kate engine bridge`
- `TODO: Sync content with Kate engine`
- `TODO: Handle buffer updates from Kate engine`
- `TODO: Implement syntax highlighting from Kate`

### Backend (`server/kate-bridge.ts`)
- `TODO: Load Kate engine libraries`
- `TODO: Initialize KTextEditor framework`
- `TODO: Create Kate document instances`
- `TODO: Apply changes to Kate engine buffer`
- `TODO: Query Kate engine for syntax highlighting`
- `TODO: Get code folding regions from Kate engine`

### Shared Types (`shared/kate-types.ts`)
- `TODO: Expand types as Kate engine integration progresses`
- `TODO: Add protocol versioning`
- `TODO: Map Kate token types to Monaco/Theia token types`
- `TODO: Add semantic highlighting support`

## Contributing

Contributions are welcome! This project is in early stages, and there are many opportunities to contribute.

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

### Current Priority Areas

1. **Kate Engine Integration Research**
   - Research embedding KTextEditor in Node.js
   - Investigate native binding technologies
   - Document Qt/KDE dependencies and setup
   - Files: Create design documents in `docs/`

2. **Protocol Design**
   - Define message protocol between frontend and backend
   - Design buffer synchronization strategy
   - Add protocol documentation
   - Files: `shared/kate-types.ts`, new docs

3. **Native Bindings Development**
   - Create Node.js bindings for KTextEditor
   - Set up build system for native modules
   - Test Kate engine initialization
   - Files: New `bindings/` directory

4. **Testing Infrastructure**
   - Set up Jest or similar test framework
   - Write unit tests for bridge and components
   - Add integration tests
   - Files: `client/tests/`, `server/tests/`

5. **Documentation**
   - Expand API documentation
   - Add architecture diagrams
   - Create user guides
   - Files: `docs/`, various README files

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

### Project Files
- Main codebase documentation in source files (see TODO comments)
- [CONTRIBUTING.md](CONTRIBUTING.md) - Detailed contribution guidelines
- [Scripts README](scripts/README.md) - Build and deployment scripts

### External Resources
- [Kate Editor](https://kate-editor.org/) - KDE Advanced Text Editor
- [KTextEditor Framework](https://api.kde.org/frameworks/ktexteditor/html/) - Kate's underlying framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Current editor (temporary)
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [TypeScript](https://www.typescriptlang.org/) - Primary language
- [Vite](https://vitejs.dev/) - Build tool and dev server

### Useful Documentation for Kate Integration
- [KDE API Documentation](https://api.kde.org/)
- [Qt Documentation](https://doc.qt.io/) - Required for KTextEditor
- [Node.js N-API](https://nodejs.org/api/n-api.html) - For native bindings
- [node-addon-api](https://github.com/nodejs/node-addon-api) - C++ wrapper for N-API

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

**Note**: This is an experimental project combining two major open source projects. Kate Neo is in active development and not yet ready for production use.
