# Contributing to Kate Neo

Thank you for your interest in contributing to Kate Neo! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Areas for Contribution](#areas-for-contribution)

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js >= 18.0.0
- Yarn >= 1.22.0
- npm
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone --recursive https://github.com/YOUR-USERNAME/Kate-Neo.git
   cd Kate-Neo
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Xivlon/Kate-Neo.git
   ```

### Set Up Development Environment

1. Install frontend dependencies:
   ```bash
   cd frontend
   yarn install
   cd ..
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
```

or for bug fixes:

```bash
git checkout -b fix/bug-description
```

### Making Changes

1. Make your changes in the appropriate directory (`frontend/`, `backend/`, or `scripts/`)
2. Add TODO comments for any deferred work or integration points
3. Update documentation in README files
4. Test your changes locally

### Testing Your Changes

```bash
# Test frontend
cd frontend
yarn build

# Test backend
cd backend
node bridge.js

# Run build script
./scripts/build.sh
```

### Keeping Your Fork Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features where appropriate
- Follow existing code style in the repository
- Add JSDoc comments for functions and classes
- Use meaningful variable and function names

Example:
```javascript
/**
 * Synchronize document buffer between frontend and Kate engine
 * 
 * @param {string} documentId - Unique identifier for the document
 * @param {Array} changes - Array of text changes to apply
 * @returns {Promise} Resolves when sync is complete
 * 
 * TODO: Implement efficient buffer sync
 * TODO: Handle concurrent edits
 */
async function syncBuffer(documentId, changes) {
  // Implementation
}
```

### Bash Scripts

- Use `#!/bin/bash` shebang
- Add `set -e` for error handling
- Include help text with `--help` option
- Use descriptive variable names
- Add comments for complex logic

### TODO Comments

Use TODO comments to mark work that needs to be done:

```javascript
// TODO: Implement Kate engine initialization
// TODO: Add error handling for network failures
// TODO: Optimize buffer sync for large files
```

## Commit Messages

### Format

Use clear, descriptive commit messages:

```
<type>: <short description>

<optional longer description>

<optional footer with issue references>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat: Add syntax highlighting bridge for Kate engine

Implement basic syntax highlighting integration between Kate's
highlighting engine and Monaco editor tokenizer.

TODO: Optimize for large files
TODO: Add support for custom themes

Fixes #123
```

```
docs: Update frontend README with setup instructions

Add detailed installation steps and troubleshooting section.
```

## Pull Request Process

### Before Submitting

1. Ensure your code follows the coding standards
2. Update documentation as needed
3. Test your changes thoroughly
4. Sync with upstream main branch
5. Resolve any merge conflicts

### Submitting the PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request from your branch

3. Fill in the PR template with:
   - Clear description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)
   - TODO items for future work

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123
Related to #456

## Changes Made
- Added feature X
- Updated documentation for Y
- Refactored Z

## Testing
- [ ] Tested frontend build
- [ ] Tested backend
- [ ] Ran build script
- [ ] Manual testing performed

## TODO
- [ ] Future work item 1
- [ ] Future work item 2

## Screenshots
(if applicable)
```

### Review Process

- A maintainer will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Areas for Contribution

### High Priority

1. **Kate Engine Integration**
   - Research embedding Kate in Node.js
   - Create bindings for Kate libraries
   - Implement basic buffer management
   - Files: `backend/bridge.js`, new Kate wrapper files

2. **Communication Protocol**
   - Define message protocol between frontend and backend
   - Implement WebSocket/IPC communication
   - Add protocol documentation
   - Files: `backend/bridge.js`, `frontend/src/`

3. **Testing Infrastructure**
   - Set up Jest or similar test framework
   - Write unit tests for bridge
   - Add integration tests
   - Files: `backend/tests/`, `frontend/tests/`

### Medium Priority

4. **Syntax Highlighting**
   - Integrate Kate syntax definitions
   - Create Monaco tokenizer adapter
   - Add theme support
   - Files: `backend/bridge.js`, `frontend/src/`

5. **Documentation**
   - Expand API documentation
   - Add architecture diagrams
   - Create user guides
   - Files: `docs/`, various README files

6. **Build & Deploy**
   - Enhance build script
   - Add deployment scripts
   - Improve CI/CD workflows
   - Files: `scripts/`, `.github/workflows/`

### Lower Priority

7. **Code Folding**
   - Expose Kate folding markers
   - Implement fold/unfold commands
   - Files: `backend/bridge.js`

8. **Search & Replace**
   - Integrate Kate's search engine
   - Add multi-file search support
   - Files: `backend/bridge.js`

9. **UI Enhancements**
   - Custom Theia extensions
   - Kate-specific UI components
   - Improved status bar
   - Files: `frontend/src/`

## Getting Help

- **Documentation**: Check the README files in each directory
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file (to be created)
- GitHub contributors page
- Release notes

Thank you for contributing to Kate Neo! 🎉
