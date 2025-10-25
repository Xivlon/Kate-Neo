# Kate Neo Scripts

This directory contains build, deployment, and utility scripts for the Kate Neo project.

## Available Scripts

### `build.sh`

Main build script for Kate Neo. Builds both frontend and backend components.

**Usage:**
```bash
./scripts/build.sh [OPTIONS]
```

**Options:**
- `--frontend-only`: Build only the frontend
- `--backend-only`: Build only the backend  
- `--clean`: Clean build artifacts before building
- `--help`: Show help message

**Examples:**
```bash
# Build everything
./scripts/build.sh

# Clean build
./scripts/build.sh --clean

# Build only frontend
./scripts/build.sh --frontend-only

# Build only backend
./scripts/build.sh --backend-only
```

**Status:** Placeholder implementation with TODO markers

## TODO: Additional Scripts

The following scripts are planned:

### Development Scripts
- [ ] `dev.sh`: Start development servers for frontend and backend
- [ ] `watch.sh`: Watch mode for continuous building during development
- [ ] `test.sh`: Run all tests (frontend, backend, integration)

### Deployment Scripts
- [ ] `deploy.sh`: Deploy Kate Neo to production
- [ ] `package.sh`: Create distribution packages
- [ ] `docker-build.sh`: Build Docker containers

### Utility Scripts
- [ ] `setup.sh`: Initial project setup and dependency installation
- [ ] `clean.sh`: Clean all build artifacts and caches
- [ ] `lint.sh`: Run linters on all code
- [ ] `format.sh`: Auto-format code

### Kate Engine Scripts
- [ ] `kate-setup.sh`: Set up Kate engine integration
- [ ] `kate-update.sh`: Update Kate engine submodule/dependency
- [ ] `kate-test.sh`: Test Kate engine integration

## Script Development Guidelines

When creating new scripts:

1. **Use bash shebang**: `#!/bin/bash`
2. **Set error handling**: `set -e` to exit on errors
3. **Add help text**: Include usage information with `--help`
4. **Use colors**: For better readability of output
5. **Check prerequisites**: Verify required tools are installed
6. **Add TODO comments**: For deferred functionality
7. **Make executable**: `chmod +x script-name.sh`
8. **Document in README**: Add entry to this file

## Environment Variables

Scripts may use the following environment variables:

- `KATE_ENGINE_PATH`: Path to Kate engine installation
- `NODE_ENV`: Environment (development/production)
- `BUILD_TARGET`: Build target platform
- `CI`: Set to `true` in CI/CD environments

## CI/CD Integration

These scripts are designed to be used in both local development and CI/CD pipelines.

See `.github/workflows/` for GitHub Actions integration (TODO).

## Contributing

When adding new scripts:
1. Follow the existing patterns and structure
2. Add comprehensive error handling
3. Include progress indicators for long operations
4. Document usage and options
5. Update this README

## Resources

- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/bash.html)
- [ShellCheck](https://www.shellcheck.net/) - Shell script linter
