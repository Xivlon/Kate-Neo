/**
 * Extension System Type Definitions
 * 
 * Defines the extension API and types for the Kate Neo IDE extension system.
 * Extensions can contribute commands, language features, UI components, and more.
 */

/**
 * Extension manifest structure
 * Defines metadata and contribution points for an extension
 */
export interface ExtensionManifest {
  /** Unique identifier for the extension (e.g., 'publisher.extension-name') */
  id: string;
  /** Display name */
  name: string;
  /** Extension version (semver) */
  version: string;
  /** Publisher/author name */
  publisher: string;
  /** Short description */
  description: string;
  /** Extension entry point file path */
  main?: string;
  /** Activation events that trigger extension loading */
  activationEvents?: string[];
  /** Contribution points */
  contributes?: {
    commands?: CommandContribution[];
    languages?: LanguageContribution[];
    themes?: ThemeContribution[];
    keybindings?: KeybindingContribution[];
    menus?: MenuContribution[];
  };
  /** Extension dependencies */
  dependencies?: Record<string, string>;
  /** Required Kate Neo IDE version */
  engines?: {
    kateNeo: string;
  };
  /** License identifier */
  license?: string;
  /** Repository URL */
  repository?: string;
  /** Extension icon path */
  icon?: string;
}

/**
 * Command contribution
 */
export interface CommandContribution {
  /** Unique command identifier */
  command: string;
  /** Display title */
  title: string;
  /** Category for grouping */
  category?: string;
  /** Icon identifier */
  icon?: string;
  /** When clause for conditional enablement */
  enablement?: string;
}

/**
 * Language contribution
 */
export interface LanguageContribution {
  /** Language identifier */
  id: string;
  /** Language display name */
  name: string;
  /** File extensions */
  extensions: string[];
  /** File name patterns */
  filenamePatterns?: string[];
  /** First line pattern for detection */
  firstLine?: string;
  /** Language configuration */
  configuration?: {
    comments?: {
      lineComment?: string;
      blockComment?: [string, string];
    };
    brackets?: Array<[string, string]>;
    autoClosingPairs?: Array<{ open: string; close: string }>;
  };
}

/**
 * Theme contribution
 */
export interface ThemeContribution {
  /** Theme identifier */
  id: string;
  /** Theme label */
  label: string;
  /** Theme type */
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  /** Path to theme file */
  path: string;
}

/**
 * Keybinding contribution
 */
export interface KeybindingContribution {
  /** Command to bind */
  command: string;
  /** Key combination */
  key: string;
  /** Mac-specific key combination */
  mac?: string;
  /** When clause */
  when?: string;
}

/**
 * Menu contribution
 */
export interface MenuContribution {
  /** Menu identifier */
  menuId: string;
  /** Command to execute */
  command: string;
  /** When clause */
  when?: string;
  /** Menu group */
  group?: string;
}

/**
 * Extension context provided to activated extensions
 */
export interface ExtensionContext {
  /** Extension identifier */
  extensionId: string;
  /** Extension path */
  extensionPath: string;
  /** Extension storage path */
  storagePath: string;
  /** Global state storage */
  globalState: StateStorage;
  /** Workspace state storage */
  workspaceState: StateStorage;
  /** Subscriptions for cleanup */
  subscriptions: Disposable[];
}

/**
 * State storage interface
 */
export interface StateStorage {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: any): Promise<void>;
}

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Workspace API
 */
export interface WorkspaceAPI {
  /** Get workspace root path */
  readonly rootPath: string | undefined;
  /** Get workspace folders */
  readonly workspaceFolders: WorkspaceFolder[] | undefined;
  /** Register file system provider */
  registerFileSystemProvider(scheme: string, provider: FileSystemProvider): Disposable;
  /** Open text document */
  openTextDocument(path: string): Promise<TextDocument>;
  /** Save all documents */
  saveAll(): Promise<boolean>;
}

/**
 * Workspace folder
 */
export interface WorkspaceFolder {
  /** Folder URI */
  uri: string;
  /** Folder name */
  name: string;
  /** Folder index */
  index: number;
}

/**
 * File system provider interface
 */
export interface FileSystemProvider {
  readFile(uri: string): Promise<Uint8Array>;
  writeFile(uri: string, content: Uint8Array): Promise<void>;
  delete(uri: string): Promise<void>;
  rename(oldUri: string, newUri: string): Promise<void>;
}

/**
 * Text document interface
 */
export interface TextDocument {
  /** Document URI */
  uri: string;
  /** Document language identifier */
  languageId: string;
  /** Document version */
  version: number;
  /** Document text content */
  getText(): string;
  /** Get text in range */
  getText(range: Range): string;
  /** Line count */
  lineCount: number;
}

/**
 * Range in document
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Position in document
 */
export interface Position {
  line: number;
  character: number;
}

/**
 * Languages API
 */
export interface LanguageAPI {
  /** Register completion provider */
  registerCompletionProvider(
    selector: LanguageSelector,
    provider: CompletionProvider
  ): Disposable;
  /** Register hover provider */
  registerHoverProvider(
    selector: LanguageSelector,
    provider: HoverProvider
  ): Disposable;
  /** Register code lens provider */
  registerCodeLensProvider(
    selector: LanguageSelector,
    provider: CodeLensProvider
  ): Disposable;
}

/**
 * Language selector (array of language IDs or '*' for all)
 */
export type LanguageSelector = string | string[];

/**
 * Completion provider
 */
export interface CompletionProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ): CompletionItem[] | Promise<CompletionItem[]>;
}

/**
 * Completion item
 */
export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

/**
 * Completion item kinds
 */
export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
}

/**
 * Hover provider
 */
export interface HoverProvider {
  provideHover(
    document: TextDocument,
    position: Position
  ): Hover | Promise<Hover | undefined>;
}

/**
 * Hover information
 */
export interface Hover {
  contents: string[];
  range?: Range;
}

/**
 * Code lens provider
 */
export interface CodeLensProvider {
  provideCodeLenses(
    document: TextDocument
  ): CodeLens[] | Promise<CodeLens[]>;
}

/**
 * Code lens
 */
export interface CodeLens {
  range: Range;
  command?: Command;
  isResolved?: boolean;
}

/**
 * Window API
 */
export interface WindowAPI {
  /** Show information message */
  showInformationMessage(message: string): Promise<void>;
  /** Show warning message */
  showWarningMessage(message: string): Promise<void>;
  /** Show error message */
  showErrorMessage(message: string): Promise<void>;
  /** Show quick pick */
  showQuickPick(items: string[]): Promise<string | undefined>;
  /** Create output channel */
  createOutputChannel(name: string): OutputChannel;
}

/**
 * Output channel
 */
export interface OutputChannel {
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

/**
 * Commands API
 */
export interface CommandAPI {
  /** Register command */
  registerCommand(command: string, callback: (...args: any[]) => any): Disposable;
  /** Execute command */
  executeCommand(command: string, ...args: any[]): Promise<any>;
  /** Get registered commands */
  getCommands(): Promise<string[]>;
}

/**
 * Command definition
 */
export interface Command {
  /** Command identifier */
  command: string;
  /** Command title */
  title: string;
  /** Command arguments */
  arguments?: any[];
}

/**
 * Complete Extension API surface
 */
export interface ExtensionAPI {
  readonly workspace: WorkspaceAPI;
  readonly languages: LanguageAPI;
  readonly window: WindowAPI;
  readonly commands: CommandAPI;
}

/**
 * Extension activation function signature
 */
export type ActivateFunction = (context: ExtensionContext) => void | Promise<void>;

/**
 * Extension deactivation function signature
 */
export type DeactivateFunction = () => void | Promise<void>;

/**
 * Extension module interface
 */
export interface ExtensionModule {
  activate: ActivateFunction;
  deactivate?: DeactivateFunction;
}

/**
 * Extension state
 */
export enum ExtensionState {
  Unloaded = 'unloaded',
  Loading = 'loading',
  Active = 'active',
  Failed = 'failed',
  Disabled = 'disabled',
}

/**
 * Loaded extension information
 */
export interface LoadedExtension {
  manifest: ExtensionManifest;
  state: ExtensionState;
  context: ExtensionContext;
  module?: ExtensionModule;
  error?: string;
  activatedAt?: number;
}

/**
 * Extension host events
 */
export type ExtensionHostEvent =
  | { type: 'extension.loaded'; extensionId: string }
  | { type: 'extension.activated'; extensionId: string }
  | { type: 'extension.deactivated'; extensionId: string }
  | { type: 'extension.failed'; extensionId: string; error: string }
  | { type: 'command.registered'; command: string }
  | { type: 'command.executed'; command: string };
