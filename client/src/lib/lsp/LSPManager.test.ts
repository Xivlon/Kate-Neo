/**
 * LSPManager Tests
 *
 * Tests for the Language Server Protocol manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LSPManager, CompletionItemKind, DiagnosticSeverity } from './LSPManager';

describe('LSPManager', () => {
  let lspManager: LSPManager;

  beforeEach(() => {
    vi.clearAllMocks();
    lspManager = new LSPManager();
  });

  afterEach(async () => {
    await lspManager.shutdown();
  });

  describe('Document Management', () => {
    it('should register a document when opened', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ capabilities: {} }),
      });
      global.fetch = mockFetch;

      await lspManager.didOpenTextDocument({
        uri: 'file:///test.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/lsp/initialize', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('/api/lsp/document/open', expect.any(Object));
    });

    it('should update document version on change', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      global.fetch = mockFetch;

      await lspManager.didOpenTextDocument({
        uri: 'file:///test.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      await lspManager.didChangeTextDocument('file:///test.ts', 'const x = 2;', 2);

      const lastCall = mockFetch.mock.calls.find(
        (call) => call[0] === '/api/lsp/document/change'
      );
      expect(lastCall).toBeDefined();
      const body = JSON.parse(lastCall![1].body);
      expect(body.version).toBe(2);
      expect(body.text).toBe('const x = 2;');
    });

    it('should remove document when closed', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      global.fetch = mockFetch;

      await lspManager.didOpenTextDocument({
        uri: 'file:///test.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      await lspManager.didCloseTextDocument('file:///test.ts');

      expect(mockFetch).toHaveBeenCalledWith('/api/lsp/document/close', expect.any(Object));
    });
  });

  describe('Completions', () => {
    it('should return empty array when document not registered', async () => {
      const completions = await lspManager.provideCompletions('file:///unknown.ts', {
        line: 0,
        character: 0,
      });

      expect(completions).toEqual([]);
    });

    it('should fetch completions from API', async () => {
      const mockCompletions = [
        { label: 'console', kind: CompletionItemKind.Module },
        { label: 'const', kind: CompletionItemKind.Keyword },
      ];

      const mockFetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/lsp/completion') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCompletions) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ capabilities: { completionProvider: true } }) });
      });
      global.fetch = mockFetch;

      await lspManager.didOpenTextDocument({
        uri: 'file:///test.ts',
        languageId: 'typescript',
        version: 1,
        text: 'con',
      });

      const completions = await lspManager.provideCompletions('file:///test.ts', {
        line: 0,
        character: 3,
      });

      expect(completions).toHaveLength(2);
      expect(completions[0].label).toBe('console');
    });
  });

  describe('Hover', () => {
    it('should return null when document not registered', async () => {
      const hover = await lspManager.provideHover('file:///unknown.ts', {
        line: 0,
        character: 0,
      });

      expect(hover).toBeNull();
    });

    it('should fetch hover information from API', async () => {
      const mockHover = { contents: 'const x: number' };

      const mockFetch = vi.fn().mockImplementation((url) => {
        if (url === '/api/lsp/hover') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockHover) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ capabilities: { hoverProvider: true } }) });
      });
      global.fetch = mockFetch;

      await lspManager.didOpenTextDocument({
        uri: 'file:///test.ts',
        languageId: 'typescript',
        version: 1,
        text: 'const x = 1;',
      });

      const hover = await lspManager.provideHover('file:///test.ts', {
        line: 0,
        character: 6,
      });

      expect(hover?.contents).toBe('const x: number');
    });
  });

  describe('Diagnostics', () => {
    it('should store and retrieve diagnostics', () => {
      const diagnostics = [
        {
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
          severity: DiagnosticSeverity.Error,
          message: 'Test error',
        },
      ];

      lspManager.setDiagnostics('file:///test.ts', diagnostics);

      const retrieved = lspManager.getDiagnostics('file:///test.ts');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].message).toBe('Test error');
    });

    it('should notify callbacks when diagnostics update', () => {
      const callback = vi.fn();
      lspManager.onDiagnostics(callback);

      const diagnostics = [
        {
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
          severity: DiagnosticSeverity.Warning,
          message: 'Test warning',
        },
      ];

      lspManager.setDiagnostics('file:///test.ts', diagnostics);

      expect(callback).toHaveBeenCalledWith('file:///test.ts', diagnostics);
    });

    it('should allow unsubscribing from diagnostics', () => {
      const callback = vi.fn();
      const unsubscribe = lspManager.onDiagnostics(callback);

      unsubscribe();

      lspManager.setDiagnostics('file:///test.ts', []);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Server Management', () => {
    it('should initialize language server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ capabilities: { completionProvider: true } }),
      });
      global.fetch = mockFetch;

      await lspManager.initializeServer('typescript');

      expect(mockFetch).toHaveBeenCalledWith('/api/lsp/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageId: 'typescript' }),
      });
    });

    it('should handle initialization failure gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false });
      global.fetch = mockFetch;

      // Should not throw
      await lspManager.initializeServer('unknown-language');
    });

    it('should shutdown all servers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ capabilities: {} }),
      });
      global.fetch = mockFetch;

      await lspManager.initializeServer('typescript');
      await lspManager.shutdown();

      expect(mockFetch).toHaveBeenCalledWith('/api/lsp/shutdown/typescript', { method: 'POST' });
    });
  });
});
