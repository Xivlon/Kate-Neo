import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { debugAdapterManager, type DebugConfiguration } from "./debug-service";
import { GitService } from "./git-service";
import { terminalService } from "./terminal-service";
import { ExtensionHost } from "./extension-host";
import { LargeFileManager } from "./large-file-manager";
import { getSettingsManager } from "./settings-manager";
import { getI18nService } from "./i18n-service";
import type { SettingsScope, SettingsUpdateRequest, SettingsGetRequest } from "../shared/settings-types";
import type { TranslationRequest } from "../shared/i18n-types";
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

  return httpServer;
}
