/**
 * AI API Integration Type Definitions
 * 
 * Defines types for custom AI API integration, supporting multiple providers
 * like OpenAI, Anthropic, and custom endpoints.
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Custom = 'custom',
}

/**
 * AI model configuration
 */
export interface AIModel {
  /** Model identifier (e.g., 'gpt-4', 'claude-3-opus') */
  id: string;
  /** Display name */
  name: string;
  /** Provider */
  provider: AIProvider;
  /** Maximum context tokens */
  maxTokens?: number;
  /** Whether model supports streaming */
  supportsStreaming?: boolean;
}

/**
 * Custom API configuration
 */
export interface CustomAPIConfig {
  /** Base URL for the API */
  baseUrl: string;
  /** API endpoint path */
  endpoint?: string;
  /** Authentication header name */
  authHeader?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request format (OpenAI-compatible or custom) */
  format?: 'openai' | 'custom';
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  /** Provider type */
  provider: AIProvider;
  /** API key */
  apiKey: string;
  /** Custom API configuration (for custom provider) */
  customConfig?: CustomAPIConfig;
  /** Default model to use */
  defaultModel?: string;
  /** Available models */
  models?: AIModel[];
  /** Enable/disable this provider */
  enabled: boolean;
}

/**
 * AI settings
 */
export interface AISettings {
  /** Enable AI assistant */
  enabled: boolean;
  /** Active provider */
  activeProvider: AIProvider;
  /** Provider configurations */
  providers: {
    [AIProvider.OpenAI]?: AIProviderConfig;
    [AIProvider.Anthropic]?: AIProviderConfig;
    [AIProvider.Custom]?: AIProviderConfig;
  };
  /** Temperature for responses (0-2) */
  temperature: number;
  /** Maximum tokens in response */
  maxResponseTokens: number;
  /** Enable streaming responses */
  streaming: boolean;
  /** System prompt */
  systemPrompt?: string;
}

/**
 * Chat message
 */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Role (user, assistant, system) */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** Model used (for assistant messages) */
  model?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  /** Messages in the conversation */
  messages: ChatMessage[];
  /** Model to use (optional, uses default if not specified) */
  model?: string;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Enable streaming */
  stream?: boolean;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  /** Success status */
  success: boolean;
  /** Response message */
  message?: ChatMessage;
  /** Error message if failed */
  error?: string;
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Code assistance request
 */
export interface CodeAssistanceRequest {
  /** Type of assistance */
  type: 'explain' | 'improve' | 'fix' | 'comment' | 'test' | 'custom';
  /** Code snippet */
  code: string;
  /** Programming language */
  language?: string;
  /** Additional context or instruction */
  instruction?: string;
  /** File path (for context) */
  filePath?: string;
}

/**
 * Code assistance response
 */
export interface CodeAssistanceResponse {
  /** Success status */
  success: boolean;
  /** Generated code or explanation */
  result?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Default AI settings
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  activeProvider: AIProvider.OpenAI,
  providers: {},
  temperature: 0.7,
  maxResponseTokens: 2000,
  streaming: true,
  systemPrompt: 'You are a helpful AI coding assistant integrated into Kate Neo IDE. Provide concise, accurate, and practical coding help.',
};

/**
 * Pre-configured AI models
 */
export const KNOWN_MODELS: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: AIProvider.OpenAI,
    maxTokens: 8192,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: AIProvider.OpenAI,
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: AIProvider.OpenAI,
    maxTokens: 16385,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: AIProvider.Anthropic,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: AIProvider.Anthropic,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: AIProvider.Anthropic,
    maxTokens: 200000,
    supportsStreaming: true,
  },
];
