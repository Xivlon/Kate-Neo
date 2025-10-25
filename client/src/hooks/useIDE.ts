/**
 * React hooks for IDE services
 * 
 * Provides React hooks for integrating core IDE services with components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  workspaceManager,
  lspManager,
  eventBus,
  IDEEventType,
  settingsManager,
  terminalManager,
  gitService,
  fileSystemWatcher,
} from '@/lib';
import type {
  Document,
  Diagnostic,
  CompletionItem,
  TerminalSession,
  GitStatus,
  FileChangeEvent,
  EventSubscription,
} from '@/lib';

/**
 * Hook to access workspace manager
 */
export function useWorkspace() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  useEffect(() => {
    // Load initial documents
    setDocuments(workspaceManager.getAllDocuments());

    // Subscribe to document changes
    const unsubscribeChange = workspaceManager.onDocumentChange((doc) => {
      setDocuments(workspaceManager.getAllDocuments());
      if (activeDocument?.uri === doc.uri) {
        setActiveDocument(doc);
      }
    });

    const unsubscribeClose = workspaceManager.onDocumentClose(() => {
      setDocuments(workspaceManager.getAllDocuments());
    });

    return () => {
      unsubscribeChange();
      unsubscribeClose();
    };
  }, [activeDocument]);

  const openDocument = useCallback(async (path: string, content: string, language: string) => {
    const doc = await workspaceManager.openDocument(path, content, language);
    setActiveDocument(doc);
    return doc;
  }, []);

  const closeDocument = useCallback(async (uri: string, saveIfDirty = false) => {
    const success = await workspaceManager.closeDocument(uri, saveIfDirty);
    if (success && activeDocument?.uri === uri) {
      const docs = workspaceManager.getAllDocuments();
      setActiveDocument(docs.length > 0 ? docs[0] : null);
    }
    return success;
  }, [activeDocument]);

  const updateDocument = useCallback((uri: string, content: string) => {
    return workspaceManager.updateDocument(uri, content);
  }, []);

  const saveDocument = useCallback(async (uri: string) => {
    return await workspaceManager.saveDocument(uri);
  }, []);

  return {
    documents,
    activeDocument,
    setActiveDocument,
    openDocument,
    closeDocument,
    updateDocument,
    saveDocument,
    saveAll: () => workspaceManager.saveAll(),
    getDirtyDocuments: () => workspaceManager.getDirtyDocuments(),
  };
}

/**
 * Hook to access LSP features for a document
 */
export function useLSP(documentUri?: string) {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    if (!documentUri) return;

    // Subscribe to diagnostics updates
    const subscription = eventBus.on(IDEEventType.LSP_DIAGNOSTICS_UPDATED, (data: any) => {
      if (data.uri === documentUri) {
        setDiagnostics(lspManager.getDiagnostics(documentUri));
      }
    });

    // Load initial diagnostics
    setDiagnostics(lspManager.getDiagnostics(documentUri));

    return () => subscription.unsubscribe();
  }, [documentUri]);

  const getCompletions = useCallback(async (line: number, character: number) => {
    if (!documentUri) return [];
    return await lspManager.provideCompletions(documentUri, { line, character });
  }, [documentUri]);

  const getHover = useCallback(async (line: number, character: number) => {
    if (!documentUri) return null;
    return await lspManager.provideHover(documentUri, { line, character });
  }, [documentUri]);

  const formatDocument = useCallback(async () => {
    if (!documentUri) return [];
    return await lspManager.formatDocument(documentUri);
  }, [documentUri]);

  return {
    diagnostics,
    getCompletions,
    getHover,
    formatDocument,
  };
}

/**
 * Hook to access settings
 */
export function useSettings() {
  const [settings, setSettings] = useState(settingsManager.getAll());

  useEffect(() => {
    const subscription = eventBus.on(IDEEventType.WORKSPACE_CONFIG_CHANGED, () => {
      setSettings(settingsManager.getAll());
    });

    return () => subscription.unsubscribe();
  }, []);

  const getSetting = useCallback(<K extends keyof typeof settings>(key: K) => {
    return settingsManager.get(key);
  }, []);

  const setSetting = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K],
    scope: 'user' | 'workspace' = 'user'
  ) => {
    settingsManager.set(key, value, scope);
  }, []);

  return {
    settings,
    getSetting,
    setSetting,
    resetSettings: (scope: 'user' | 'workspace' = 'user') => settingsManager.reset(scope),
    exportSettings: () => settingsManager.export(),
    importSettings: (json: string) => settingsManager.import(json),
  };
}

/**
 * Hook to manage terminal sessions
 */
export function useTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSession, setActiveSession] = useState<TerminalSession | undefined>();

  useEffect(() => {
    // Load initial sessions
    setSessions(terminalManager.getAllSessions());
    setActiveSession(terminalManager.getActiveSession());

    // Subscribe to terminal events
    const subscriptions: EventSubscription[] = [
      eventBus.on(IDEEventType.TERMINAL_CREATED, () => {
        setSessions(terminalManager.getAllSessions());
        setActiveSession(terminalManager.getActiveSession());
      }),
      eventBus.on(IDEEventType.TERMINAL_CLOSED, () => {
        setSessions(terminalManager.getAllSessions());
        setActiveSession(terminalManager.getActiveSession());
      }),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const createSession = useCallback(async (cwd = '/', shell?: string, title?: string) => {
    const session = await terminalManager.createSession(cwd, shell, title);
    terminalManager.setActiveSession(session.id);
    return session;
  }, []);

  const closeSession = useCallback(async (sessionId: string) => {
    return await terminalManager.closeSession(sessionId);
  }, []);

  const sendInput = useCallback(async (sessionId: string, data: string) => {
    return await terminalManager.sendInput(sessionId, data);
  }, []);

  const onOutput = useCallback((sessionId: string, handler: (data: string) => void) => {
    return terminalManager.onOutput(sessionId, (output) => handler(output.data));
  }, []);

  return {
    sessions,
    activeSession,
    setActiveSession: (sessionId: string) => {
      terminalManager.setActiveSession(sessionId);
      setActiveSession(terminalManager.getActiveSession());
    },
    createSession,
    closeSession,
    sendInput,
    onOutput,
  };
}

/**
 * Hook to access Git operations
 */
export function useGit() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Git is ready
    setIsReady(gitService.isReady());

    // Subscribe to Git events
    const subscription = eventBus.on(IDEEventType.GIT_STATUS_CHANGED, async () => {
      const newStatus = await gitService.getStatus();
      setStatus(newStatus);
    });

    // Load initial status
    if (gitService.isReady()) {
      gitService.getStatus().then(setStatus);
    }

    return () => subscription.unsubscribe();
  }, []);

  const initialize = useCallback(async (repositoryPath: string) => {
    const success = await gitService.initialize(repositoryPath);
    setIsReady(success);
    if (success) {
      const newStatus = await gitService.getStatus();
      setStatus(newStatus);
    }
    return success;
  }, []);

  const stageFile = useCallback(async (path: string) => {
    const success = await gitService.stageFile(path);
    if (success) {
      const newStatus = await gitService.getStatus();
      setStatus(newStatus);
    }
    return success;
  }, []);

  const commit = useCallback(async (message: string, files?: string[]) => {
    const hash = await gitService.commit(message, files);
    if (hash) {
      const newStatus = await gitService.getStatus();
      setStatus(newStatus);
    }
    return hash;
  }, []);

  return {
    status,
    isReady,
    initialize,
    stageFile,
    unstageFile: (path: string) => gitService.unstageFile(path),
    commit,
    getBranches: () => gitService.getBranches(),
    createBranch: (name: string, checkout: boolean) => gitService.createBranch(name, checkout),
    checkoutBranch: (name: string) => gitService.checkoutBranch(name),
    pull: (remote?: string, branch?: string) => gitService.pull(remote, branch),
    push: (remote?: string, branch?: string) => gitService.push(remote, branch),
    getHistory: (limit?: number) => gitService.getHistory(limit),
    discardChanges: (path: string) => gitService.discardChanges(path),
    getCurrentBranch: () => gitService.getCurrentBranch(),
  };
}

/**
 * Hook to watch file system changes
 */
export function useFileWatcher(path?: string) {
  const [changes, setChanges] = useState<FileChangeEvent[]>([]);
  const handlersRef = useRef<((event: FileChangeEvent) => void)[]>([]);

  useEffect(() => {
    if (!path) return;

    const handler = (event: FileChangeEvent) => {
      setChanges(prev => [...prev, event]);
      handlersRef.current.forEach(h => h(event));
    };

    const unwatch = fileSystemWatcher.watch(path, handler);

    return () => {
      unwatch();
    };
  }, [path]);

  const onFileChange = useCallback((handler: (event: FileChangeEvent) => void) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter(h => h !== handler);
    };
  }, []);

  return {
    changes,
    onFileChange,
    clearChanges: () => setChanges([]),
  };
}

/**
 * Hook to subscribe to IDE events
 */
export function useIDEEvent<T = any>(
  eventType: IDEEventType | IDEEventType[],
  handler: (data: T) => void
) {
  useEffect(() => {
    const events = Array.isArray(eventType) ? eventType : [eventType];
    const subscriptions = events.map(type => eventBus.on(type, handler));

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [eventType, handler]);
}
