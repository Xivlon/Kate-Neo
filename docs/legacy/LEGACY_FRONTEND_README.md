# Kate Neo Frontend

This directory contains the Theia-based frontend for Kate Neo IDE.

## Overview

The frontend uses Eclipse Theia as the base framework, providing a modern, extensible IDE interface. This will serve as the UI layer while the Kate engine handles the backend text editing functionality.

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- Yarn >= 1.22.0

### Installation

1. Install dependencies:
```bash
cd frontend
yarn install
```

2. Build the application:
```bash
yarn build
```

3. Start the development server:
```bash
yarn start
```

The application will be available at `http://localhost:3000`

## Development

### Watch Mode

For active development with auto-rebuild:
```bash
yarn watch
```

### Clean Build

To perform a clean build:
```bash
yarn clean
yarn build
```

## Architecture

The frontend is structured as a Theia application with the following components:

- **Core Theia Extensions**: Provides basic IDE functionality (editor, filesystem, terminal, etc.)
- **Kate Bridge Integration**: TODO - Will connect to Kate engine backend for advanced text editing features
- **Custom Extensions**: TODO - Kate-specific functionality and UI customizations

## TODO: Kate Engine Integration

The following integration points are planned for connecting to the Kate engine:

1. **Text Buffer Bridge**: Connect Theia's Monaco editor to Kate's text buffer management
   - TODO: Implement buffer synchronization protocol
   - TODO: Handle multi-cursor and selection state

2. **Syntax Highlighting**: Leverage Kate's syntax highlighting engine
   - TODO: Create adapter for Kate syntax definitions
   - TODO: Implement dynamic theme synchronization

3. **Code Folding**: Use Kate's intelligent code folding
   - TODO: Expose Kate folding markers to Theia UI
   - TODO: Implement fold/unfold commands

4. **Auto-Indentation**: Integrate Kate's smart indentation
   - TODO: Hook into Theia's formatting provider API
   - TODO: Configure language-specific indent rules

5. **Search & Replace**: Utilize Kate's powerful search capabilities
   - TODO: Implement search backend using Kate engine
   - TODO: Support regex and multi-file search

## Submodules

This project may use git submodules for certain dependencies. To clone with submodules:

```bash
git clone --recursive <repository-url>
```

Or if already cloned:
```bash
git submodule update --init --recursive
```

## Contributing

When adding new features or extensions, please:
1. Follow Theia's extension development patterns
2. Document integration points with Kate engine
3. Add TODO comments for deferred Kate functionality
4. Update this README with setup or usage changes

## Resources

- [Theia Documentation](https://theia-ide.org/docs/)
- [Kate Editor](https://kate-editor.org/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
