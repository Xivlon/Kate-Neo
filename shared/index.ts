/**
 * Shared Types - Barrel Export
 *
 * Common types used by both client and server
 */

export * from './ai-types';
export * from './i18n-types';
export * from './schema';
export * from './settings-types';

// Extension types (excluding Position/Range to avoid conflict with kate-types)
export {
  ExtensionManifest,
  ExtensionContext,
  ExtensionAPI,
  ExtensionModule,
  ExtensionState,
  LoadedExtension,
  ExtensionHostEvent,
  Disposable,
  StateStorage,
  WorkspaceAPI,
  LanguageAPI,
  WindowAPI,
  CommandAPI,
  Command,
} from './extension-types';

// Kate types (primary Position/Range definitions)
export * from './kate-types';
