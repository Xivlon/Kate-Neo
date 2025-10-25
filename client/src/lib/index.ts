/**
 * Kate IDE Core Services
 * 
 * Central export for all core IDE services and managers
 */

// LSP
export * from './lsp/LSPManager';

// Workspace
export * from './workspace/WorkspaceManager';

// Events
export * from './events/EventBus';

// File System
export * from './fs/FileSystemWatcher';

// Settings
export * from './settings/SettingsManager';

// Terminal
export * from './terminal/TerminalManager';

// Git
export * from './git/GitService';

// UI
export * from './ui/PanelManager';

// Re-export existing utilities
export * from './utils';
export * from './queryClient';
export * from './fileSystem';
