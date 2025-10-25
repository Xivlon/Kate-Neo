# Qt/KDE Environment Requirements

## Overview

This document details the dependencies, system requirements, and setup procedures needed to integrate KTextEditor (part of KDE Frameworks) with a Node.js application.

## System Requirements

### Operating Systems

#### Linux (Primary Platform)
- **Recommended**: Ubuntu 22.04 LTS, Fedora 38+, Debian 12+, Arch Linux
- **Required**: X11 or Wayland display server (for GUI components)
- **Alternative**: Headless mode with QCoreApplication (no display needed)

#### macOS
- **Version**: macOS 11+ (Big Sur or later)
- **Via**: Homebrew for Qt and KDE dependencies
- **Challenge**: KDE Frameworks less native on macOS
- **Recommendation**: Linux VM or container for development

#### Windows
- **Version**: Windows 10/11
- **Via**: MSYS2 or vcpkg for dependencies
- **Challenge**: Most complex setup, limited KDE support
- **Recommendation**: WSL2 with Linux distribution

### Hardware Requirements

#### Minimum
- **CPU**: Dual-core processor
- **RAM**: 4 GB
- **Disk**: 2 GB for dependencies
- **Display**: Not required for headless mode

#### Recommended
- **CPU**: Quad-core processor
- **RAM**: 8 GB+
- **Disk**: 5 GB+ for development tools
- **Display**: 1920x1080+ for GUI development

## Core Dependencies

### 1. Qt Framework

#### Required Qt Modules
- **Qt Core**: Core non-GUI functionality
- **Qt GUI**: GUI foundation classes
- **Qt Widgets**: Widget classes (if using GUI)
- **Qt Network**: Network support (optional)
- **Qt DBus**: D-Bus IPC (Linux)

#### Version Requirements
- **Qt 5**: Version 5.15.x (stable, widely supported)
- **Qt 6**: Version 6.5+ (modern, recommended for new projects)
- **Note**: KTextEditor has versions for both Qt5 and Qt6

#### Installation

**Ubuntu/Debian:**
```bash
# Qt5
sudo apt-get install \
    qt5-default \
    qtbase5-dev \
    qtbase5-dev-tools \
    libqt5core5a \
    libqt5gui5 \
    libqt5widgets5

# Qt6 (if needed)
sudo apt-get install \
    qt6-base-dev \
    qt6-base-dev-tools \
    libqt6core6 \
    libqt6gui6 \
    libqt6widgets6
```

**Fedora:**
```bash
# Qt5
sudo dnf install \
    qt5-qtbase \
    qt5-qtbase-devel

# Qt6
sudo dnf install \
    qt6-qtbase \
    qt6-qtbase-devel
```

**Arch Linux:**
```bash
# Qt5
sudo pacman -S qt5-base

# Qt6
sudo pacman -S qt6-base
```

**macOS (Homebrew):**
```bash
# Qt5
brew install qt@5

# Qt6
brew install qt
```

### 2. KDE Frameworks

#### Required Frameworks (KF5)
- **KCoreAddons**: Core utilities
- **KI18n**: Internationalization
- **KParts**: Plugin framework
- **KConfig**: Configuration system
- **KTextEditor**: Text editor framework
- **Syntax Highlighting**: Syntax highlighting engine

#### Version Requirements
- **KF5**: Version 5.90+ (for Qt5)
- **KF6**: Version 6.0+ (for Qt6)

#### Installation

**Ubuntu/Debian:**
```bash
# Add KDE neon repository for latest KF5
sudo add-apt-repository ppa:kubuntu-ppa/backports
sudo apt-get update

# Install KDE Frameworks 5
sudo apt-get install \
    extra-cmake-modules \
    libkf5coreaddons-dev \
    libkf5i18n-dev \
    libkf5parts-dev \
    libkf5config-dev \
    libkf5texteditor-dev \
    libkf5syntaxhighlighting-dev
```

**Fedora:**
```bash
sudo dnf install \
    extra-cmake-modules \
    kf5-kcoreaddons-devel \
    kf5-ki18n-devel \
    kf5-kparts-devel \
    kf5-kconfig-devel \
    kf5-ktexteditor-devel \
    kf5-syntax-highlighting-devel
```

**Arch Linux:**
```bash
sudo pacman -S \
    extra-cmake-modules \
    kcoreaddons \
    ki18n \
    kparts \
    kconfig \
    ktexteditor \
    syntax-highlighting
```

**macOS (Homebrew):**
```bash
# Add KDE tap
brew tap kde-mac/kde

# Install frameworks
brew install \
    extra-cmake-modules \
    kcoreaddons \
    ki18n \
    kparts \
    kconfig \
    ktexteditor \
    syntax-highlighting
```

### 3. Build Tools

#### CMake
- **Version**: 3.16+ (3.20+ recommended)
- **Purpose**: Build system for KDE and Qt projects

**Installation:**
```bash
# Ubuntu/Debian
sudo apt-get install cmake

# Fedora
sudo dnf install cmake

# Arch
sudo pacman -S cmake

# macOS
brew install cmake
```

#### Extra CMake Modules (ECM)
- **Version**: Same as KF5/KF6
- **Purpose**: CMake modules for KDE
- **Included**: Usually installed with KDE Frameworks

#### C++ Compiler
- **GCC**: 9+ (supports C++17)
- **Clang**: 10+ (supports C++17)
- **MSVC**: 2019+ (Windows only)

**Installation:**
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora
sudo dnf groupinstall "Development Tools"

# Arch
sudo pacman -S base-devel

# macOS (Xcode Command Line Tools)
xcode-select --install
```

### 4. Node.js Build Tools

#### node-gyp
- **Purpose**: Build native addons
- **Installation**: `npm install -g node-gyp`

#### Python
- **Version**: 3.7+ (required by node-gyp)
- **Installation**: Usually pre-installed on Linux/macOS

#### pkg-config
- **Purpose**: Find library compile/link flags
- **Installation**: `sudo apt-get install pkg-config` (Linux)

## Environment Variables

### Qt Environment

#### Qt 5
```bash
# Add to ~/.bashrc or ~/.zshrc
export Qt5_DIR=/usr/lib/x86_64-linux-gnu/cmake/Qt5
export QT_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/qt5/plugins
export QT_QPA_PLATFORM_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/qt5/plugins/platforms
```

#### Qt 6
```bash
export Qt6_DIR=/usr/lib/x86_64-linux-gnu/cmake/Qt6
export QT_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/qt6/plugins
export QT_QPA_PLATFORM_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/qt6/plugins/platforms
```

### KDE Environment

```bash
# KDE Frameworks directories
export KF5_PREFIX=/usr
export KF5_INCLUDE_DIR=/usr/include/KF5
export CMAKE_PREFIX_PATH=/usr/lib/x86_64-linux-gnu/cmake

# XDG directories for KDE config
export XDG_DATA_DIRS=/usr/share:$XDG_DATA_DIRS
export XDG_CONFIG_DIRS=/etc/xdg:$XDG_CONFIG_DIRS
```

### For Headless Mode

```bash
# Disable GUI requirements
export QT_QPA_PLATFORM=offscreen

# Or minimal platform
export QT_QPA_PLATFORM=minimal
```

## Runtime Dependencies

### Syntax Highlighting Definitions

**Location**: `/usr/share/org.kde.syntax-highlighting/syntax/`

**Contents**: 300+ XML files defining syntax for languages

**Installation**: Comes with `syntax-highlighting` package

**Custom Definitions**: Can add to `~/.local/share/org.kde.syntax-highlighting/syntax/`

### Icon Themes (Optional)

**For GUI Mode**:
```bash
# Ubuntu/Debian
sudo apt-get install breeze-icon-theme

# Fedora
sudo dnf install breeze-icon-theme

# Arch
sudo pacman -S breeze-icons
```

### Font Configuration

**Recommended Fonts**:
- **Monospace**: Fira Code, JetBrains Mono, Source Code Pro
- **Installation**:
```bash
# Ubuntu/Debian
sudo apt-get install fonts-firacode

# Fedora
sudo dnf install fira-code-fonts

# Arch
sudo pacman -S ttf-fira-code
```

## Dependency Verification

### Check Qt Installation

```bash
# Check Qt version
qmake --version

# Check Qt modules
pkg-config --list-all | grep Qt5

# Check Qt libraries
ldconfig -p | grep libQt5
```

### Check KDE Frameworks

```bash
# Check KF5 version
pkg-config --modversion KF5TextEditor

# Check installed frameworks
ls /usr/lib/x86_64-linux-gnu/cmake/KF5*

# Check ktexteditor library
ldconfig -p | grep libKF5TextEditor
```

### Test Compilation

**test_qt.cpp**:
```cpp
#include <QtCore/QCoreApplication>
#include <QtCore/QDebug>

int main(int argc, char *argv[]) {
    QCoreApplication app(argc, argv);
    qDebug() << "Qt version:" << QT_VERSION_STR;
    return 0;
}
```

**Compile**:
```bash
g++ -std=c++17 test_qt.cpp -o test_qt \
    $(pkg-config --cflags --libs Qt5Core)
./test_qt
```

**test_ktexteditor.cpp**:
```cpp
#include <KTextEditor/Editor>
#include <QCoreApplication>
#include <QDebug>

int main(int argc, char *argv[]) {
    QCoreApplication app(argc, argv);
    
    KTextEditor::Editor* editor = KTextEditor::Editor::instance();
    qDebug() << "KTextEditor version:" << editor->version();
    
    return 0;
}
```

**Compile**:
```bash
g++ -std=c++17 test_ktexteditor.cpp -o test_ktexteditor \
    $(pkg-config --cflags --libs KF5TextEditor Qt5Core)
./test_ktexteditor
```

## Docker Development Environment

### Dockerfile

```dockerfile
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    git \
    curl \
    # Qt5
    qt5-default \
    qtbase5-dev \
    # KDE Frameworks
    extra-cmake-modules \
    libkf5coreaddons-dev \
    libkf5i18n-dev \
    libkf5parts-dev \
    libkf5config-dev \
    libkf5texteditor-dev \
    libkf5syntaxhighlighting-dev \
    # Node.js
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Install node-gyp globally
RUN npm install -g node-gyp

# Set environment variables
ENV QT_QPA_PLATFORM=offscreen
ENV CMAKE_PREFIX_PATH=/usr/lib/x86_64-linux-gnu/cmake

WORKDIR /workspace

CMD ["/bin/bash"]
```

### Build and Run

```bash
# Build image
docker build -t kate-neo-dev .

# Run container
docker run -it --rm \
    -v $(pwd):/workspace \
    kate-neo-dev

# Inside container, test compilation
cd /workspace
npm install
npm run build
```

## Platform-Specific Notes

### Linux

**Advantages**:
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Native KDE support
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Best performance
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Easiest setup
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/checkbox-checked-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/checkbox-checked-symbolic.svg"><img alt="checkbox-checked-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Complete feature set

**Display Server**:
- For GUI: X11 or Wayland required
- For headless: Set `QT_QPA_PLATFORM=offscreen`

**Package Managers**:
- APT (Debian/Ubuntu)
- DNF (Fedora)
- Pacman (Arch)

### macOS

**Challenges**:
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> KDE not native to macOS
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Some features may not work
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Limited community support

**Solutions**:
- Use Homebrew for dependencies
- Test thoroughly
- Consider Linux VM for development

**Homebrew Setup**:
```bash
# Add KDE tap
brew tap kde-mac/kde

# Install dependencies
brew install qt ktexteditor
```

### Windows

**Challenges**:
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Most complex setup
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Limited KDE support
- <picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/light/window-close-symbolic.svg"><source media="(prefers-color-scheme: light)" srcset="https://github.com/StorageB/icons/blob/main/GNOME46Adwaita/dark/window-close-symbolic.svg"><img alt="window-close-symbolic" src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png"></picture> Path and build issues

**Recommended Approach**:
1. Use WSL2 with Ubuntu
2. Follow Linux instructions in WSL
3. Develop and test in Linux environment

**Alternative (Native Windows)**:
- Use MSYS2 or vcpkg
- Expect compatibility issues
- May need custom builds

## Minimal Headless Setup

### For Server/CI Environments

**Minimal Dependencies**:
```bash
# Install only what's needed for headless mode
sudo apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    qtbase5-dev \
    libkf5coreaddons-dev \
    libkf5texteditor-dev

# No X11, no GUI packages needed
```

**Environment**:
```bash
export QT_QPA_PLATFORM=offscreen
export QML_IMPORT_PATH=""
export QML2_IMPORT_PATH=""
```

**Benefits**:
- Smaller footprint
- No display server needed
- Faster in CI/CD
- Works in containers

## Troubleshooting

### Common Issues

#### "Qt platform plugin not found"
```bash
export QT_QPA_PLATFORM=offscreen
# Or install platform plugins
sudo apt-get install libqt5gui5
```

#### "Cannot find KF5TextEditor"
```bash
# Check installation
pkg-config --exists KF5TextEditor && echo "Found" || echo "Not found"

# Reinstall
sudo apt-get install --reinstall libkf5texteditor-dev
```

#### "CMake cannot find Qt5"
```bash
# Set Qt directory
export Qt5_DIR=/usr/lib/x86_64-linux-gnu/cmake/Qt5

# Or add to CMakeLists.txt
set(CMAKE_PREFIX_PATH "/usr/lib/x86_64-linux-gnu/cmake")
```

#### "Symbol not found" or linking errors
```bash
# Check library path
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH

# Update library cache
sudo ldconfig
```

### Verification Script

```bash
#!/bin/bash
# verify_deps.sh - Check all dependencies

echo "Checking Qt..."
pkg-config --exists Qt5Core && echo "✓ Qt5Core" || echo "✗ Qt5Core"

echo "Checking KDE Frameworks..."
pkg-config --exists KF5TextEditor && echo "✓ KF5TextEditor" || echo "✗ KF5TextEditor"

echo "Checking build tools..."
command -v cmake >/dev/null && echo "✓ CMake" || echo "✗ CMake"
command -v node >/dev/null && echo "✓ Node.js" || echo "✗ Node.js"
command -v node-gyp >/dev/null && echo "✓ node-gyp" || echo "✗ node-gyp"

echo "Checking compilers..."
command -v g++ >/dev/null && echo "✓ g++" || echo "✗ g++"

echo "Checking environment..."
[ -n "$QT_QPA_PLATFORM" ] && echo "✓ QT_QPA_PLATFORM=$QT_QPA_PLATFORM" || echo "ℹ QT_QPA_PLATFORM not set"
```

## Recommended Setup Procedure

1. **Install Base System** (Linux recommended)
2. **Install Build Tools** (cmake, g++, pkg-config)
3. **Install Qt5 or Qt6** (qtbase5-dev)
4. **Install KDE Frameworks** (libkf5texteditor-dev)
5. **Install Node.js** (v18+ LTS)
6. **Install node-gyp** (`npm install -g node-gyp`)
7. **Set Environment Variables** (QT_QPA_PLATFORM, etc.)
8. **Verify Installation** (run verification script)
9. **Test Compilation** (compile test programs)
10. **Build Native Addon** (npm run build)

## Next Steps

- Set up development environment
- Verify all dependencies
- Test basic Qt/KTextEditor programs
- Configure node-gyp for KTextEditor
- Build first native addon prototype

## Resources

- [Qt Installation Guide](https://doc.qt.io/qt-5/gettingstarted.html)
- [KDE Frameworks Documentation](https://api.kde.org/frameworks/)
- [node-gyp Setup](https://github.com/nodejs/node-gyp#installation)
- [Docker for Development](https://docs.docker.com/get-started/)
