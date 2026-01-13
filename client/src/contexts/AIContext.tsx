/**
 * AI Context
 *
 * Provides global state management for AI conversations, persisting messages
 * across tab switches and providing editor context awareness.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, AIModel } from '../../../shared/ai-types';

// Editor context for AI awareness
export interface EditorContext {
  filePath: string | null;
  fileName: string | null;
  language: string | null;
  content: string | null;
  selection: string | null;
  cursorLine: number | null;
}

// Conversation type for multiple chat sessions
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AIContextValue {
  // Conversation state
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];

  // AI status
  aiEnabled: boolean;
  activeProvider: string;
  availableModels: AIModel[];
  selectedModel: string;
  isLoading: boolean;

  // Editor context
  editorContext: EditorContext;

  // Actions
  sendMessage: (content: string, includeContext?: boolean) => Promise<void>;
  clearChat: () => void;
  setSelectedModel: (model: string) => void;
  updateEditorContext: (context: Partial<EditorContext>) => void;
  createNewConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  refreshAIStatus: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

const STORAGE_KEY = 'kate-ai-conversations';
const MAX_CONVERSATIONS = 50;

// Helper to detect language from file extension
function detectLanguage(fileName: string | null): string | null {
  if (!fileName) return null;
  const ext = fileName.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
  };
  return langMap[ext || ''] || ext || null;
}

export function AIProvider({ children }: { children: React.ReactNode }) {
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // AI status
  const [aiEnabled, setAiEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Editor context
  const [editorContext, setEditorContext] = useState<EditorContext>({
    filePath: null,
    fileName: null,
    language: null,
    content: null,
    selection: null,
    cursorLine: null,
  });

  // Track if we've loaded from storage
  const hasLoadedRef = useRef(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          if (data.activeConversationId) {
            setActiveConversationId(data.activeConversationId);
          } else if (data.conversations.length > 0) {
            setActiveConversationId(data.conversations[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load AI conversations:', error);
    }

    // Fetch AI status
    fetchAIStatus();
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        conversations,
        activeConversationId,
      }));
    } catch (error) {
      console.error('Failed to save AI conversations:', error);
    }
  }, [conversations, activeConversationId]);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiEnabled(data.enabled);
      setActiveProvider(data.provider || '');
      setAvailableModels(data.models || []);
      if (data.models && data.models.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    }
  };

  // Get current messages from active conversation
  const messages = React.useMemo(() => {
    if (!activeConversationId) return [];
    const conv = conversations.find(c => c.id === activeConversationId);
    return conv?.messages || [];
  }, [conversations, activeConversationId]);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations(prev => {
      // Limit total conversations
      const updated = [newConv, ...prev].slice(0, MAX_CONVERSATIONS);
      return updated;
    });
    setActiveConversationId(newConv.id);
  }, []);

  // Switch to a different conversation
  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || null);
    }
  }, [activeConversationId, conversations]);

  // Clear current chat
  const clearChat = useCallback(() => {
    if (!activeConversationId) return;

    setConversations(prev => prev.map(conv =>
      conv.id === activeConversationId
        ? { ...conv, messages: [], updatedAt: Date.now() }
        : conv
    ));
  }, [activeConversationId]);

  // Update editor context
  const updateEditorContext = useCallback((context: Partial<EditorContext>) => {
    setEditorContext(prev => {
      const updated = { ...prev, ...context };
      // Auto-detect language if fileName changed
      if (context.fileName !== undefined) {
        updated.language = detectLanguage(context.fileName);
      }
      return updated;
    });
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content: string, includeContext = true) => {
    if (!content.trim() || isLoading) return;

    // Create conversation if none exists
    let convId = activeConversationId;
    if (!convId) {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [newConv, ...prev].slice(0, MAX_CONVERSATIONS));
      setActiveConversationId(newConv.id);
      convId = newConv.id;
    }

    // Build context-aware message
    let fullContent = content;
    if (includeContext && editorContext.filePath) {
      const contextParts: string[] = [];

      if (editorContext.selection) {
        contextParts.push(`[Selected code from ${editorContext.fileName}]:\n\`\`\`${editorContext.language || ''}\n${editorContext.selection}\n\`\`\``);
      } else if (editorContext.content) {
        // Include file content if it's not too large
        const maxContentLength = 4000;
        const truncatedContent = editorContext.content.length > maxContentLength
          ? editorContext.content.slice(0, maxContentLength) + '\n... (truncated)'
          : editorContext.content;
        contextParts.push(`[Current file: ${editorContext.fileName}]:\n\`\`\`${editorContext.language || ''}\n${truncatedContent}\n\`\`\``);
      }

      if (contextParts.length > 0) {
        fullContent = `${contextParts.join('\n\n')}\n\n${content}`;
      }
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content, // Store original message for display
      timestamp: Date.now(),
    };

    // Update conversation with user message
    setConversations(prev => prev.map(conv =>
      conv.id === convId
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            title: conv.messages.length === 0 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : conv.title,
            updatedAt: Date.now(),
          }
        : conv
    ));

    setIsLoading(true);

    try {
      // Get current messages for context
      const currentConv = conversations.find(c => c.id === convId);
      const historyMessages = currentConv?.messages || [];

      // Build messages array for API - use full content with context for API
      const apiUserMessage = { ...userMessage, content: fullContent };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...historyMessages, apiUserMessage],
          model: selectedModel || undefined,
          context: includeContext ? {
            filePath: editorContext.filePath,
            fileName: editorContext.fileName,
            language: editorContext.language,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        setConversations(prev => prev.map(conv =>
          conv.id === convId
            ? {
                ...conv,
                messages: [...conv.messages, data.message],
                updatedAt: Date.now(),
              }
            : conv
        ));
      } else {
        // Add error message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get AI response'}`,
          timestamp: Date.now(),
          error: data.error,
        };
        setConversations(prev => prev.map(conv =>
          conv.id === convId
            ? { ...conv, messages: [...conv.messages, errorMessage], updatedAt: Date.now() }
            : conv
        ));
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error: Failed to communicate with AI service',
        timestamp: Date.now(),
        error: 'Network error',
      };
      setConversations(prev => prev.map(conv =>
        conv.id === convId
          ? { ...conv, messages: [...conv.messages, errorMessage], updatedAt: Date.now() }
          : conv
      ));
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, conversations, editorContext, isLoading, selectedModel]);

  const value: AIContextValue = {
    conversations,
    activeConversationId,
    messages,
    aiEnabled,
    activeProvider,
    availableModels,
    selectedModel,
    isLoading,
    editorContext,
    sendMessage,
    clearChat,
    setSelectedModel,
    updateEditorContext,
    createNewConversation,
    switchConversation,
    deleteConversation,
    refreshAIStatus: fetchAIStatus,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
