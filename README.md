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
├── frontend/           # Theia-based IDE frontend
│   ├── src/           # Frontend source code
│   │   └── App.tsx    # Placeholder React component
│   ├── package.json   # Frontend dependencies and scripts
│   └── README.md      # Frontend documentation
│
├── backend/           # Kate engine bridge
│   ├── bridge.js      # Backend bridge implementation (placeholder)
│   ├── package.json   # Backend dependencies and scripts
│   └── README.md      # Backend documentation
│
├── scripts/           # Build and utility scripts
│   ├── build.sh       # Main build script
│   └── README.md      # Scripts documentation
│
├── .github/
│   └── workflows/     # CI/CD pipelines
│       ├── frontend-build.yml
│       └── backend-build.yml
│
└── README.md          # This file
```

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0 (for frontend)
- **npm** (for backend)
- **Git** with submodule support

### Clone the Repository

To clone with all submodules (if applicable):

```bash
git clone --recursive https://github.com/Xivlon/Kate-Neo.git
cd Kate-Neo
```

Or if already cloned:

```bash
git submodule update --init --recursive
```

### Build

Use the build script to build both frontend and backend:

```bash
./scripts/build.sh
```

**Note**: The build script is currently in placeholder mode. Full implementation pending Kate engine integration.

For more build options:
```bash
./scripts/build.sh --help
```

### Development Setup

#### Frontend Setup

```bash
cd frontend
yarn install
yarn start
```

See `frontend/README.md` for detailed instructions.

#### Backend Setup

```bash
cd backend
npm install
npm start
```

See `backend/README.md` for detailed instructions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│          Theia Frontend (Web)           │
│  ┌─────────────────────────────────┐   │
│  │  Monaco Editor UI Components    │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ WebSocket/IPC
┌─────────────────▼──────────────────────┐
│         Backend Bridge (Node.js)        │
│  ┌─────────────────────────────────┐   │
│  │  Protocol Handler & Sync Logic  │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼──────────────────────┘
                  │ Native Binding
┌─────────────────▼──────────────────────┐
│        Kate Text Editor Engine          │
│  ┌─────────────────────────────────┐   │
│  │  Buffer, Syntax, Indent, Search │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Components

1. **Frontend (Theia)**
   - Web-based IDE interface
   - Monaco editor integration
   - Extension system
   - File system browser
   - Terminal, search, and other IDE features

2. **Backend Bridge**
   - Communication layer between Theia and Kate
   - Buffer synchronization
   - Protocol translation
   - State management

3. **Kate Engine** (To be integrated)
   - Text buffer management
   - Syntax highlighting
   - Code folding
   - Smart indentation
   - Search and replace
   - Session management

## Development Roadmap

### Phase 1: Project Setup ✅ (Current)
- [x] Create repository structure
- [x] Set up frontend skeleton with Theia
- [x] Set up backend bridge placeholder
- [x] Add build scripts
- [x] Configure CI/CD workflows
- [x] Document architecture and setup

### Phase 2: Kate Engine Integration (TODO)
- [ ] Research Kate engine embedding options
- [ ] Create Kate engine bindings/wrapper
- [ ] Implement basic buffer synchronization
- [ ] Test Kate engine initialization

### Phase 3: Core Features (TODO)
- [ ] Implement syntax highlighting bridge
- [ ] Add code folding integration
- [ ] Integrate smart indentation
- [ ] Implement search functionality
- [ ] Add session management

### Phase 4: Advanced Features (TODO)
- [ ] Multi-cursor support
- [ ] Language-specific features
- [ ] Custom Theia extensions for Kate features
- [ ] Performance optimization
- [ ] Comprehensive testing

### Phase 5: Polish & Release (TODO)
- [ ] User documentation
- [ ] API documentation
- [ ] Example configurations
- [ ] Package for distribution
- [ ] Release version 1.0

## Contributing

Contributions are welcome! This project is in early stages, and there are many opportunities to contribute:

### Current Needs

1. **Kate Engine Integration**: Help with embedding Kate engine in Node.js
2. **Protocol Design**: Define communication protocol between frontend and backend
3. **Testing**: Set up test infrastructure and write tests
4. **Documentation**: Improve and expand documentation
5. **UI/UX**: Design Kate-specific Theia extensions

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with clear commit messages
4. Add tests if applicable
5. Update documentation
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code structure and patterns
- Add TODO comments for deferred work
- Document Kate engine integration points
- Write clear commit messages
- Update relevant README files
- Ensure builds pass before submitting PR

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
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
- [Scripts README](scripts/README.md)

### External Resources
- [Eclipse Theia](https://theia-ide.org/)
- [Kate Editor](https://kate-editor.org/)
- [KTextEditor Framework](https://api.kde.org/frameworks/ktexteditor/html/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

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
