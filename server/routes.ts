import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { debugAdapterManager, type DebugConfiguration } from "./services/debug-service";
import { GitService } from "./services/git-service";
import { terminalService } from "./services/terminal-service";
import { ExtensionHost } from "./services/extension-host";
import { LargeFileManager } from "./services/large-file-manager";
import { getSettingsManager } from "./services/settings-manager";
import { getI18nService } from "./services/i18n-service";
import { aiService } from "./services/ai-service";
import { KateBridge } from "./services/kate-bridge";
import { requireAuthOrDev } from "./middleware/auth-middleware";
import { authLimiter, fileOperationLimiter } from "./middleware/rate-limit";
import type { SettingsScope, SettingsUpdateRequest, SettingsGetRequest } from "../shared/settings-types";
import type { TranslationRequest } from "../shared/i18n-types";
import type { ChatCompletionRequest, CodeAssistanceRequest, AIProvider } from "../shared/ai-types";
import * as path from "path";
import * as fs from "fs/promises";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  // Initialize Git service for the current workspace
  const workspacePath = process.cwd();
  const gitService = new GitService(workspacePath);
  await gitService.initialize();

  // Initialize Extension Host
  const extensionHost = new ExtensionHost(path.join(workspacePath, 'extensions'));
  await extensionHost.initialize();

  // Initialize Large File Manager
  const largeFileManager = new LargeFileManager({
    chunkSize: 1000,
    maxFullLoadSize: 5 * 1024 * 1024, // 5MB
    enableIndexing: true,
  });

  // Initialize Settings Manager
  const settingsManager = getSettingsManager({
    workspaceDir: workspacePath,
  });
  await settingsManager.initialize();

  // Initialize I18n Service
  const i18nService = getI18nService({
    localesDir: path.join(workspacePath, 'locales'),
  });
  await i18nService.initialize();

  // Initialize AI Service
  const currentSettings = await settingsManager.getSettings({});
  if (currentSettings.success && currentSettings.settings) {
    const aiSettings = (currentSettings.settings as any).ai;
    if (aiSettings) {
      await aiService.initialize(aiSettings);
    }
  }

  // Initialize Kate Bridge for KTextEditor integration
  const kateBridge = new KateBridge({ debug: process.env.NODE_ENV === 'development' });
  await kateBridge.initialize(httpServer).catch((error) => {
    console.warn('[KateBridge] Failed to initialize:', error.message);
    console.warn('[KateBridge] Kate features will be unavailable');
  });

  // Authentication API endpoints
  app.post("/api/auth/login", authLimiter, async (req, res, next) => {
    const passport = await import('passport');
    passport.default.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: info?.message || 'Invalid credentials' 
        });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        return res.json({ 
          success: true, 
          user: { id: user.id, username: user.username } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", authLimiter, (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/session", authLimiter, (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: req.user 
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Debug API endpoints
  app.post("/api/debug/sessions", async (req, res) => {
    try {
      const config: DebugConfiguration = req.body;
      const session = await debugAdapterManager.createSession(config);
      await session.start();
      res.json({ 
        sessionId: session.id,
        state: session.state 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug/sessions", (req, res) => {
    const sessions = debugAdapterManager.getAllSessions();
    res.json(sessions.map(s => ({ 
      id: s.id, 
      state: s.state 
    })));
  });

  app.post("/api/debug/sessions/:id/breakpoints", async (req, res) => {
    try {
      const session = debugAdapterManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const { source, breakpoints } = req.body;
      const result = await session.setBreakpoints(source, breakpoints);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/debug/sessions/:id/continue", async (req, res) => {
    try {
      const session = debugAdapterManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      await session.continue();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/debug/sessions/:id/pause", async (req, res) => {
    try {
      const session = debugAdapterManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      await session.pause();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/debug/sessions/:id", async (req, res) => {
    try {
      const session = debugAdapterManager.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      await session.terminate();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Git API endpoints
  app.get("/api/git/status", async (req, res) => {
    try {
      const status = await gitService.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/git/branches", async (req, res) => {
    try {
      const branches = await gitService.getBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/git/branch/current", async (req, res) => {
    try {
      const branch = await gitService.getCurrentBranch();
      res.json({ branch });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/git/branch/checkout", async (req, res) => {
    try {
      const { branchName } = req.body;
      const success = await gitService.checkoutBranch(branchName);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/git/stage", async (req, res) => {
    try {
      const { filePath } = req.body;
      const success = await gitService.stageFile(filePath);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/git/unstage", async (req, res) => {
    try {
      const { filePath } = req.body;
      const success = await gitService.unstageFile(filePath);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/git/commit", async (req, res) => {
    try {
      const { message } = req.body;
      const success = await gitService.commit(message);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/git/diff/:filePath(*)", async (req, res) => {
    try {
      const { filePath } = req.params;
      const { staged } = req.query;
      const diff = await gitService.getFileDiff(filePath, staged === 'true');
      res.json({ diff });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/git/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await gitService.getCommitHistory(limit);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Terminal WebSocket
  const wss = new WebSocketServer({ server: httpServer, path: '/api/terminal' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[Terminal] Client connected');
    
    let sessionId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'create':
            const session = await terminalService.createSession(message.config || {});
            sessionId = session.id;
            
            // Forward terminal output to WebSocket
            session.on('data', (output: string) => {
              ws.send(JSON.stringify({
                type: 'data',
                sessionId,
                data: output,
              }));
            });
            
            session.on('exit', (code: number) => {
              ws.send(JSON.stringify({
                type: 'exit',
                sessionId,
                code,
              }));
            });
            
            ws.send(JSON.stringify({
              type: 'created',
              sessionId,
            }));
            break;
            
          case 'input':
            if (sessionId) {
              terminalService.writeToSession(sessionId, message.data);
            }
            break;
            
          case 'resize':
            if (sessionId) {
              terminalService.resizeSession(sessionId, message.dimensions);
            }
            break;
            
          case 'kill':
            if (sessionId) {
              terminalService.killSession(sessionId);
              sessionId = null;
            }
            break;
        }
      } catch (error) {
        console.error('[Terminal] Error handling message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[Terminal] Client disconnected');
      if (sessionId) {
        terminalService.killSession(sessionId);
      }
    });
  });

  // Extension API endpoints
  app.get("/api/extensions", (req, res) => {
    try {
      const extensions = extensionHost.getExtensions();
      res.json({ 
        extensions: extensions.map(ext => ({
          id: ext.manifest.id,
          name: ext.manifest.name,
          version: ext.manifest.version,
          description: ext.manifest.description,
          publisher: ext.manifest.publisher,
          state: ext.state,
          error: ext.error,
          activatedAt: ext.activatedAt,
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/extensions/:id/activate", async (req, res) => {
    try {
      await extensionHost.activateExtension(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/extensions/:id/deactivate", async (req, res) => {
    try {
      await extensionHost.deactivateExtension(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/extensions/commands", async (req, res) => {
    try {
      const commands = extensionHost.getCommands();
      res.json({ commands });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/extensions/commands/:command", async (req, res) => {
    try {
      const result = await extensionHost.executeCommand(
        req.params.command,
        ...(req.body.args || [])
      );
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Large File API endpoints
  app.get("/api/files/metadata/:filePath(*)", async (req, res) => {
    try {
      // Sanitize file path to prevent directory traversal
      const requestedPath = req.params.filePath;
      const filePath = path.join(workspacePath, requestedPath);
      
      // Ensure the resolved path is within the workspace
      const resolvedPath = path.resolve(filePath);
      const resolvedWorkspace = path.resolve(workspacePath);
      
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return res.status(403).json({ error: 'Access denied: Path outside workspace' });
      }
      
      const metadata = await largeFileManager.getFileMetadata(resolvedPath);
      const shouldUseLargeFile = await largeFileManager.shouldUseLargeFileHandling(resolvedPath);
      
      res.json({ 
        ...metadata, 
        useLargeFileHandling: shouldUseLargeFile 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/files/index/:filePath(*)", async (req, res) => {
    try {
      const requestedPath = req.params.filePath;
      const filePath = path.join(workspacePath, requestedPath);
      
      // Ensure the resolved path is within the workspace
      const resolvedPath = path.resolve(filePath);
      const resolvedWorkspace = path.resolve(workspacePath);
      
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return res.status(403).json({ error: 'Access denied: Path outside workspace' });
      }
      
      await largeFileManager.buildLineIndex(resolvedPath);
      const stats = await largeFileManager.getFileStats(resolvedPath);
      res.json({ indexed: true, stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/chunk/:filePath(*)", async (req, res) => {
    try {
      const requestedPath = req.params.filePath;
      const filePath = path.join(workspacePath, requestedPath);
      
      // Ensure the resolved path is within the workspace
      const resolvedPath = path.resolve(filePath);
      const resolvedWorkspace = path.resolve(workspacePath);
      
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return res.status(403).json({ error: 'Access denied: Path outside workspace' });
      }
      
      const startLine = parseInt(req.query.startLine as string) || 0;
      const lineCount = parseInt(req.query.lineCount as string) || 100;
      
      const chunk = await largeFileManager.getChunk(resolvedPath, startLine, lineCount);
      res.json(chunk);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/stats/:filePath(*)", async (req, res) => {
    try {
      const requestedPath = req.params.filePath;
      const filePath = path.join(workspacePath, requestedPath);
      
      // Ensure the resolved path is within the workspace
      const resolvedPath = path.resolve(filePath);
      const resolvedWorkspace = path.resolve(workspacePath);
      
      if (!resolvedPath.startsWith(resolvedWorkspace)) {
        return res.status(403).json({ error: 'Access denied: Path outside workspace' });
      }
      
      const stats = await largeFileManager.getFileStats(resolvedPath);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Settings API endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const request: SettingsGetRequest = {
        scope: req.query.scope as SettingsScope | undefined,
        key: req.query.key as string | undefined,
      };
      const response = await settingsManager.getSettings(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const request: SettingsUpdateRequest = req.body;
      const response = await settingsManager.updateSetting(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/settings", async (req, res) => {
    try {
      const { scope, key } = req.body;
      const response = await settingsManager.deleteSetting(scope as SettingsScope, key);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/settings/reset", async (req, res) => {
    try {
      const { scope } = req.body;
      const response = await settingsManager.resetSettings(scope as SettingsScope);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // I18n API endpoints
  app.get("/api/i18n/locales", (req, res) => {
    try {
      const locales = i18nService.getAvailableLocales();
      res.json(locales);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/i18n/locale", (req, res) => {
    try {
      const locale = i18nService.getCurrentLocale();
      res.json({ locale });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/i18n/locale", async (req, res) => {
    try {
      const { locale } = req.body;
      const success = await i18nService.setLocale(locale);
      res.json({ success, locale: i18nService.getCurrentLocale() });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/i18n/translate", (req, res) => {
    try {
      const request: TranslationRequest = req.body;
      const response = i18nService.translate(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/i18n/translations", (req, res) => {
    try {
      const locale = req.query.locale as string | undefined;
      const translations = locale 
        ? i18nService.getTranslationsForLocale(locale)
        : i18nService.getAllTranslations();
      res.json({ translations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI API endpoints
  app.get("/api/ai/status", (req, res) => {
    try {
      const settings = aiService.getSettings();
      res.json({
        enabled: aiService.isEnabled(),
        provider: settings?.activeProvider,
        models: aiService.getAvailableModels(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const request: ChatCompletionRequest = req.body;
      const response = await aiService.chatCompletion(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/code-assistance", async (req, res) => {
    try {
      const request: CodeAssistanceRequest = req.body;
      const response = await aiService.codeAssistance(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ai/test-connection", async (req, res) => {
    try {
      const { provider } = req.body;
      const response = await aiService.testConnection(provider as AIProvider | undefined);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Listen for settings changes to update AI service
  settingsManager.on('settingsChanged', (event) => {
    if (event.keys.some((key: string) => key.startsWith('ai'))) {
      settingsManager.getSettings({}).then(result => {
        if (result.success && result.settings) {
          const aiSettings = (result.settings as any).ai;
          if (aiSettings) {
            aiService.updateSettings(aiSettings);
          }
        }
      });
    }
  });

  // Agent API endpoints
  const { AgentService } = await import('./services/agent-service.js');
  const agentService = new AgentService(aiService, workspacePath);

  app.get("/api/agent/capabilities", async (req, res) => {
    try {
      const capabilities = agentService.getCapabilities();
      res.json({ success: true, capabilities });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/agent/settings", async (req, res) => {
    try {
      const settings = agentService.getSettings();
      res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/agent/settings", fileOperationLimiter, requireAuthOrDev, async (req, res) => {
    try {
      agentService.updateSettings(req.body);
      res.json({ success: true, settings: agentService.getSettings() });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/agent/execute", fileOperationLimiter, requireAuthOrDev, async (req, res) => {
    try {
      const request = req.body;
      const response = await agentService.executeTask(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/agent/file-operation", fileOperationLimiter, requireAuthOrDev, async (req, res) => {
    try {
      const request = req.body;
      const response = await agentService.fileOperation(request);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // LSP API endpoints (Phase 8)
  // Import LSP service
  const { lspService } = await import('./services/lsp-service');

  app.post("/api/lsp/initialize", async (req, res) => {
    try {
      const { languageId } = req.body;
      const success = await lspService.initializeServer(languageId);
      if (success) {
        const capabilities = lspService.getServerCapabilities(languageId);
        res.json({ success: true, capabilities });
      } else {
        res.status(400).json({ success: false, error: 'Failed to initialize server' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lsp/shutdown/:languageId", async (req, res) => {
    try {
      await lspService.shutdownServer(req.params.languageId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lsp/document/open", async (req, res) => {
    try {
      const { uri, languageId, version, text } = req.body;
      await lspService.didOpenTextDocument(uri, languageId, version, text);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lsp/document/change", async (req, res) => {
    try {
      const { uri, text, version } = req.body;
      const changes = [{ text }];
      await lspService.didChangeTextDocument(uri, changes, version);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lsp/document/close", async (req, res) => {
    try {
      const { uri } = req.body;
      await lspService.didCloseTextDocument(uri);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/lsp/completion", async (req, res) => {
    try {
      const { uri, position } = req.body;
      const completions = await lspService.provideCompletions(uri, position);
      res.json(completions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lsp/hover", async (req, res) => {
    try {
      const { uri, position } = req.body;
      const hover = await lspService.provideHover(uri, position);
      res.json(hover);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lsp/definition", async (req, res) => {
    try {
      const { uri, position } = req.body;
      const definition = await lspService.gotoDefinition(uri, position);
      res.json(definition);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lsp/references", async (req, res) => {
    try {
      const { uri, position } = req.body;
      const references = await lspService.findReferences(uri, position);
      res.json(references);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lsp/diagnostics", async (req, res) => {
    try {
      const { uri } = req.query;
      // Diagnostics are pushed via notifications, so we return empty here
      // Frontend should subscribe to diagnostic updates
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lsp/symbols", async (req, res) => {
    try {
      const { uri } = req.query as { uri: string };
      const symbols = await lspService.provideDocumentSymbols(uri);
      res.json(symbols);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lsp/format", async (req, res) => {
    try {
      const { uri } = req.body;
      const edits = await lspService.formatDocument(uri, {
        tabSize: 2,
        insertSpaces: true
      });
      res.json(edits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lsp/servers", (req, res) => {
    const servers = lspService.getRunningServers();
    res.json(servers);
  });

  // Java/Tomcat API endpoints
  const { javaService } = await import('./services/java-service');
  await javaService.initialize().catch(() => {
    console.log('[Java] Java runtime not available');
  });

  app.get("/api/java/status", (req, res) => {
    const status = javaService.getStatus();
    res.json(status);
  });

  app.post("/api/java/compile", async (req, res) => {
    try {
      const { sourceFiles, outputDir, classpath } = req.body;
      const result = await javaService.compile(sourceFiles, outputDir, classpath);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/java/run", async (req, res) => {
    try {
      const { className, classpath, args, options } = req.body;
      const result = await javaService.run(className, classpath, args, options);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/tomcat/start", async (req, res) => {
    try {
      await javaService.startTomcat();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/tomcat/stop", async (req, res) => {
    try {
      await javaService.stopTomcat();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/tomcat/status", async (req, res) => {
    try {
      const status = await javaService.getTomcatStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tomcat/deploy", async (req, res) => {
    try {
      const { name, source, contextPath } = req.body;
      const deployment = await javaService.deploy(name, source, contextPath);
      res.json(deployment);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/tomcat/undeploy/:name", async (req, res) => {
    try {
      const success = await javaService.undeploy(req.params.name);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/java/create-servlet-project", async (req, res) => {
    try {
      const { projectPath, options } = req.body;
      await javaService.createServletProject(projectPath, options);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // OpenSCAD API endpoints
  const { openscadService } = await import('./services/openscad-service');
  await openscadService.initialize().catch(() => {
    console.log('[OpenSCAD] OpenSCAD not available');
  });

  app.get("/api/openscad/status", (req, res) => {
    const status = openscadService.getStatus();
    res.json(status);
  });

  app.post("/api/openscad/render", async (req, res) => {
    try {
      const { sourceCode, options } = req.body;
      const result = await openscadService.render(sourceCode, options);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/openscad/validate", async (req, res) => {
    try {
      const { sourceCode } = req.body;
      const errors = await openscadService.validateSyntax(sourceCode);
      res.json({ errors });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/openscad/templates", (req, res) => {
    const templates = openscadService.getTemplates();
    res.json(templates);
  });

  app.get("/api/openscad/autocomplete", (req, res) => {
    const { prefix } = req.query;
    const suggestions = openscadService.getAutocompleteSuggestions(prefix as string || '');
    res.json(suggestions);
  });

  app.post("/api/openscad/cancel/:renderId", (req, res) => {
    const cancelled = openscadService.cancelRender(req.params.renderId);
    res.json({ cancelled });
  });

  // Kate Bridge Status API
  app.get("/api/kate/status", (req, res) => {
    const status = kateBridge.getStatus();
    res.json(status);
  });

  // Health check endpoint for production monitoring
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  return httpServer;
}
