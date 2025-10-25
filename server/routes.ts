import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { debugAdapterManager, type DebugConfiguration } from "./debug-service";
import { GitService } from "./git-service";
import { terminalService } from "./terminal-service";
import * as path from "path";

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

  return httpServer;
}
