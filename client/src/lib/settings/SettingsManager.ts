/**
 * Settings Manager - Application and workspace settings management
 * 
 * Manages user preferences, workspace configuration, and editor settings
 */

import { eventBus, IDEEventType } from '../events/EventBus';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineNumbers: 'on' | 'off' | 'relative';
  wordWrap: 'on' | 'off' | 'bounded';
  tabSize: number;
  insertSpaces: boolean;
  autoSave: 'off' | 'afterDelay' | 'onFocusChange';
  autoSaveDelay: number;
  minimap: {
    enabled: boolean;
    maxColumn: number;
  };
  scrollBeyondLastLine: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
}

export interface LanguageSettings {
  [languageId: string]: {
    tabSize?: number;
    insertSpaces?: boolean;
    formatOnSave?: boolean;
    lintOnSave?: boolean;
  };
}

export interface ThemeSettings {
  theme: 'light' | 'dark' | 'auto';
  colorTheme: string;
  iconTheme: string;
}

export interface WorkspaceSettings {
  files: {
    exclude: string[];
    watcherExclude: string[];
    autoSave: boolean;
  };
  search: {
    exclude: string[];
    useGitIgnore: boolean;
  };
  git: {
    enabled: boolean;
    autoFetch: boolean;
  };
}

export interface IDESettings {
  editor: EditorSettings;
  languages: LanguageSettings;
  theme: ThemeSettings;
  workspace: WorkspaceSettings;
  extensions: {
    autoUpdate: boolean;
    allowedIds: string[];
  };
}

export type SettingsScope = 'user' | 'workspace';

const DEFAULT_SETTINGS: IDESettings = {
  editor: {
    fontSize: 14,
    fontFamily: '"Fira Code", "Courier New", monospace',
    lineNumbers: 'on',
    wordWrap: 'off',
    tabSize: 2,
    insertSpaces: true,
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    minimap: {
      enabled: true,
      maxColumn: 120,
    },
    scrollBeyondLastLine: true,
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    renderWhitespace: 'selection',
  },
  languages: {},
  theme: {
    theme: 'dark',
    colorTheme: 'vs-dark',
    iconTheme: 'vs-minimal',
  },
  workspace: {
    files: {
      exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      watcherExclude: ['**/node_modules/**', '**/.git/**'],
      autoSave: true,
    },
    search: {
      exclude: ['**/node_modules/**', '**/dist/**'],
      useGitIgnore: true,
    },
    git: {
      enabled: true,
      autoFetch: false,
    },
  },
  extensions: {
    autoUpdate: true,
    allowedIds: ['*'],
  },
};

/**
 * Settings Manager Class
 * 
 * Manages application and workspace settings with persistence
 */
export class SettingsManager {
  private userSettings: IDESettings;
  private workspaceSettings: Partial<IDESettings> = {};
  private readonly STORAGE_KEY = 'kate-ide-settings';

  constructor() {
    this.userSettings = this.loadSettings();
    console.log('[SettingsManager] Initialized');
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): IDESettings {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return this.mergeDeep(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.error('[SettingsManager] Failed to load settings:', error);
    }

    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userSettings));
    } catch (error) {
      console.error('[SettingsManager] Failed to save settings:', error);
    }
  }

  /**
   * Get a setting value
   */
  get<K extends keyof IDESettings>(key: K): IDESettings[K];
  get<K extends keyof IDESettings, S extends keyof IDESettings[K]>(
    key: K,
    subKey: S
  ): IDESettings[K][S];
  get(key: keyof IDESettings, subKey?: any): any {
    // Merge workspace and user settings
    const merged = this.mergeDeep(this.userSettings, this.workspaceSettings);

    if (subKey !== undefined) {
      return (merged[key] as any)?.[subKey];
    }
    return merged[key];
  }

  /**
   * Update a setting value
   */
  set<K extends keyof IDESettings>(
    key: K,
    value: IDESettings[K],
    scope?: SettingsScope
  ): void;
  set<K extends keyof IDESettings, S extends keyof IDESettings[K]>(
    key: K,
    subKey: S,
    value: IDESettings[K][S],
    scope?: SettingsScope
  ): void;
  set(key: keyof IDESettings, subKeyOrValue: any, valueOrScope?: any, scopeParam?: any): void {
    const scope: SettingsScope =
      typeof valueOrScope === 'string' ? valueOrScope : scopeParam || 'user';
    
    const settings: any = scope === 'user' ? this.userSettings : this.workspaceSettings;

    if (scopeParam !== undefined) {
      // Setting a nested value
      const subKey = subKeyOrValue;
      const value = valueOrScope;
      if (!settings[key]) {
        settings[key] = {} as any;
      }
      settings[key][subKey] = value;
    } else {
      // Setting a top-level value
      settings[key] = subKeyOrValue;
    }

    if (scope === 'user') {
      this.saveSettings();
    }

    // Emit settings changed event
    eventBus.emit(IDEEventType.WORKSPACE_CONFIG_CHANGED, { key, scope });
  }

  /**
   * Reset settings to defaults
   */
  reset(scope: SettingsScope = 'user'): void {
    if (scope === 'user') {
      this.userSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      this.saveSettings();
    } else {
      this.workspaceSettings = {};
    }

    eventBus.emit(IDEEventType.WORKSPACE_CONFIG_CHANGED, { scope, reset: true });
  }

  /**
   * Get all settings
   */
  getAll(): IDESettings {
    return this.mergeDeep(this.userSettings, this.workspaceSettings);
  }

  /**
   * Export settings as JSON
   */
  export(): string {
    return JSON.stringify(this.userSettings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  import(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      this.userSettings = this.mergeDeep(DEFAULT_SETTINGS, parsed);
      this.saveSettings();
      eventBus.emit(IDEEventType.WORKSPACE_CONFIG_CHANGED, { imported: true });
      return true;
    } catch (error) {
      console.error('[SettingsManager] Failed to import settings:', error);
      return false;
    }
  }

  /**
   * Deep merge two objects
   */
  private mergeDeep<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result: any = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key] as any);
      } else if (source[key] !== undefined) {
        result[key] = source[key] as any;
      }
    }

    return result;
  }
}

/**
 * Global settings manager instance
 */
export const settingsManager = new SettingsManager();
