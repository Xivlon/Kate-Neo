/**
 * Settings Type Definitions
 * 
 * Defines the structure and types for Kate Neo IDE settings,
 * including editor settings, language-specific configurations,
 * and extension settings.
 */

import { AISettings, DEFAULT_AI_SETTINGS } from './ai-types.js';

/**
 * Settings scope determines where settings are stored and applied
 */
export enum SettingsScope {
  /** Global settings apply to all workspaces */
  Global = 'global',
  /** Workspace settings apply to the current workspace */
  Workspace = 'workspace',
  /** Folder settings apply to specific folders within a workspace */
  Folder = 'folder',
}

/**
 * Editor configuration settings
 */
export interface EditorSettings {
  /** Font size in pixels */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Line number display mode */
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  /** Tab size in spaces */
  tabSize: number;
  /** Whether to insert spaces when Tab is pressed */
  insertSpaces: boolean;
  /** Word wrap configuration */
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  /** Word wrap column */
  wordWrapColumn: number;
  /** Enable/disable minimap */
  minimap: MinimapSettings;
  /** Cursor style */
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  /** Cursor blinking */
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  /** Auto save configuration */
  autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
  /** Auto save delay in milliseconds */
  autoSaveDelay: number;
  /** Format on save */
  formatOnSave: boolean;
  /** Format on paste */
  formatOnPaste: boolean;
  /** Render whitespace */
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  /** Render control characters */
  renderControlCharacters: boolean;
  /** Rulers (vertical lines) at specific columns */
  rulers: number[];
  /** Bracket pair colorization */
  bracketPairColorization: boolean;
}

/**
 * Minimap settings
 */
export interface MinimapSettings {
  /** Enable/disable minimap */
  enabled: boolean;
  /** Maximum column to render in minimap */
  maxColumn: number;
  /** Render characters or blocks */
  renderCharacters: boolean;
  /** Show slider on hover */
  showSlider: 'always' | 'mouseover';
}

/**
 * Terminal settings
 */
export interface TerminalSettings {
  /** Shell to use */
  shell: string;
  /** Font size */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Cursor style */
  cursorStyle: 'block' | 'underline' | 'bar';
  /** Cursor blink */
  cursorBlink: boolean;
  /** Scrollback buffer size */
  scrollback: number;
}

/**
 * Git settings
 */
export interface GitSettings {
  /** Enable git integration */
  enabled: boolean;
  /** Auto fetch */
  autoFetch: boolean;
  /** Auto fetch interval in seconds */
  autoFetchInterval: number;
  /** Confirm before sync */
  confirmSync: boolean;
  /** Default clone directory */
  defaultCloneDirectory: string;
}

/**
 * Debug settings
 */
export interface DebugSettings {
  /** Show debug console on start */
  showConsole: 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart';
  /** Open debug view on start */
  openDebugView: boolean;
  /** Focus editor on break */
  focusEditorOnBreak: boolean;
  /** Show inline values */
  showInlineValues: boolean;
}

/**
 * Extension settings
 */
export interface ExtensionSettings {
  /** Auto update extensions */
  autoUpdate: boolean;
  /** Auto check for updates */
  autoCheckUpdates: boolean;
  /** Allowed extension IDs (glob patterns) */
  allowedIds: string[];
  /** Show recommendations */
  showRecommendations: boolean;
}

/**
 * Language-specific settings
 * Key is the language ID (e.g., 'typescript', 'python', 'rust')
 */
export interface LanguageSettings {
  [languageId: string]: LanguageConfiguration;
}

/**
 * Configuration for a specific language
 */
export interface LanguageConfiguration {
  /** Tab size override for this language */
  tabSize?: number;
  /** Insert spaces override for this language */
  insertSpaces?: boolean;
  /** Language-specific formatting options */
  formatting?: Record<string, unknown>;
  /** Language-specific linting options */
  linting?: Record<string, unknown>;
  /** Custom settings for this language */
  [key: string]: unknown;
}

/**
 * Complete Kate Neo settings structure
 */
export interface KateNeoSettings {
  /** Editor settings */
  editor: EditorSettings;
  /** Terminal settings */
  terminal: TerminalSettings;
  /** Git settings */
  git: GitSettings;
  /** Debug settings */
  debug: DebugSettings;
  /** Extension settings */
  extensions: ExtensionSettings;
  /** AI assistant settings */
  ai: AISettings;
  /** Language-specific settings */
  languages: LanguageSettings;
  /** Custom settings from extensions or plugins */
  [key: string]: unknown;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: KateNeoSettings = {
  editor: {
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
    lineNumbers: 'on',
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    wordWrapColumn: 80,
    minimap: {
      enabled: true,
      maxColumn: 120,
      renderCharacters: true,
      showSlider: 'mouseover',
    },
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    formatOnSave: false,
    formatOnPaste: false,
    renderWhitespace: 'selection',
    renderControlCharacters: false,
    rulers: [],
    bracketPairColorization: true,
  },
  terminal: {
    shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
    cursorStyle: 'block',
    cursorBlink: true,
    scrollback: 1000,
  },
  git: {
    enabled: true,
    autoFetch: false,
    autoFetchInterval: 180,
    confirmSync: true,
    defaultCloneDirectory: '',
  },
  debug: {
    showConsole: 'openOnSessionStart',
    openDebugView: true,
    focusEditorOnBreak: true,
    showInlineValues: true,
  },
  extensions: {
    autoUpdate: false,
    autoCheckUpdates: true,
    allowedIds: ['*'],
    showRecommendations: true,
  },
  ai: DEFAULT_AI_SETTINGS,
  languages: {},
};

/**
 * Settings update request
 */
export interface SettingsUpdateRequest {
  /** Settings scope */
  scope: SettingsScope;
  /** Settings key (dot-notation supported, e.g., 'editor.fontSize') */
  key: string;
  /** Settings value */
  value: unknown;
}

/**
 * Settings get request
 */
export interface SettingsGetRequest {
  /** Settings scope (optional, defaults to merged settings) */
  scope?: SettingsScope;
  /** Settings key (dot-notation supported, e.g., 'editor.fontSize') */
  key?: string;
}

/**
 * Settings response
 */
export interface SettingsResponse {
  /** Success status */
  success: boolean;
  /** Settings data */
  settings?: Partial<KateNeoSettings> | unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Settings change event
 */
export interface SettingsChangeEvent {
  /** Settings scope */
  scope: SettingsScope;
  /** Changed keys */
  keys: string[];
  /** Timestamp */
  timestamp: number;
}
