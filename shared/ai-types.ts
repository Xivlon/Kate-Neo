/**
 * AI API Integration Type Definitions
 *
 * Defines types for custom AI API integration, supporting multiple providers
 * like OpenAI, Anthropic, and popular alternative providers.
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  // Popular alternative providers (OpenAI-compatible)
  Deepseek = 'deepseek',
  Qwen = 'qwen',
  Groq = 'groq',
  Together = 'together',
  Mistral = 'mistral',
  Ollama = 'ollama',
  OpenRouter = 'openrouter',
  Perplexity = 'perplexity',
  // Fully custom endpoint
  Custom = 'custom',
}

/**
 * Provider template for quick configuration
 */
export interface AIProviderTemplate {
  /** Provider identifier */
  id: AIProvider;
  /** Display name */
  name: string;
  /** Provider description */
  description: string;
  /** Base API URL */
  baseUrl: string;
  /** API endpoint path */
  endpoint: string;
  /** Authentication header name */
  authHeader: string;
  /** Auth prefix (e.g., 'Bearer ') */
  authPrefix: string;
  /** API key placeholder/hint */
  apiKeyPlaceholder: string;
  /** Link to get API key */
  apiKeyLink?: string;
  /** Whether this is an OpenAI-compatible API */
  openaiCompatible: boolean;
  /** Default models for this provider */
  defaultModels: AIModel[];
  /** Whether the provider supports local/self-hosted */
  supportsLocal?: boolean;
  /** Additional headers required */
  additionalHeaders?: Record<string, string>;
}

/**
 * Pre-configured provider templates for easy setup
 */
export const AI_PROVIDER_TEMPLATES: Record<AIProvider, AIProviderTemplate> = {
  [AIProvider.OpenAI]: {
    id: AIProvider.OpenAI,
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 and other OpenAI models',
    baseUrl: 'https://api.openai.com',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'sk-...',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    openaiCompatible: true,
    defaultModels: [],
  },
  [AIProvider.Anthropic]: {
    id: AIProvider.Anthropic,
    name: 'Anthropic',
    description: 'Claude 3 Opus, Sonnet, and Haiku models',
    baseUrl: 'https://api.anthropic.com',
    endpoint: '/v1/messages',
    authHeader: 'x-api-key',
    authPrefix: '',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyLink: 'https://console.anthropic.com/settings/keys',
    openaiCompatible: false,
    additionalHeaders: { 'anthropic-version': '2023-06-01' },
    defaultModels: [],
  },
  [AIProvider.Deepseek]: {
    id: AIProvider.Deepseek,
    name: 'Deepseek',
    description: 'Deepseek Coder and Chat models - excellent for coding',
    baseUrl: 'https://api.deepseek.com',
    endpoint: '/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'sk-...',
    apiKeyLink: 'https://platform.deepseek.com/api_keys',
    openaiCompatible: true,
    defaultModels: [
      { id: 'deepseek-chat', name: 'Deepseek Chat', provider: AIProvider.Deepseek, maxTokens: 64000, supportsStreaming: true },
      { id: 'deepseek-coder', name: 'Deepseek Coder', provider: AIProvider.Deepseek, maxTokens: 64000, supportsStreaming: true },
      { id: 'deepseek-reasoner', name: 'Deepseek Reasoner (R1)', provider: AIProvider.Deepseek, maxTokens: 64000, supportsStreaming: true },
    ],
  },
  [AIProvider.Qwen]: {
    id: AIProvider.Qwen,
    name: 'Qwen (Alibaba)',
    description: 'Qwen models from Alibaba Cloud',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'sk-...',
    apiKeyLink: 'https://dashscope.console.aliyun.com/apiKey',
    openaiCompatible: true,
    defaultModels: [
      { id: 'qwen-turbo', name: 'Qwen Turbo', provider: AIProvider.Qwen, maxTokens: 8000, supportsStreaming: true },
      { id: 'qwen-plus', name: 'Qwen Plus', provider: AIProvider.Qwen, maxTokens: 32000, supportsStreaming: true },
      { id: 'qwen-max', name: 'Qwen Max', provider: AIProvider.Qwen, maxTokens: 32000, supportsStreaming: true },
      { id: 'qwen-coder-turbo', name: 'Qwen Coder Turbo', provider: AIProvider.Qwen, maxTokens: 128000, supportsStreaming: true },
    ],
  },
  [AIProvider.Groq]: {
    id: AIProvider.Groq,
    name: 'Groq',
    description: 'Ultra-fast inference with Llama, Mixtral, and more',
    baseUrl: 'https://api.groq.com/openai',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'gsk_...',
    apiKeyLink: 'https://console.groq.com/keys',
    openaiCompatible: true,
    defaultModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: AIProvider.Groq, maxTokens: 32768, supportsStreaming: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: AIProvider.Groq, maxTokens: 8192, supportsStreaming: true },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: AIProvider.Groq, maxTokens: 32768, supportsStreaming: true },
      { id: 'deepseek-r1-distill-llama-70b', name: 'Deepseek R1 Distill 70B', provider: AIProvider.Groq, maxTokens: 8192, supportsStreaming: true },
    ],
  },
  [AIProvider.Together]: {
    id: AIProvider.Together,
    name: 'Together AI',
    description: 'Wide selection of open-source models',
    baseUrl: 'https://api.together.xyz',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'your-api-key',
    apiKeyLink: 'https://api.together.xyz/settings/api-keys',
    openaiCompatible: true,
    defaultModels: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', name: 'Llama 3.1 70B Turbo', provider: AIProvider.Together, maxTokens: 8192, supportsStreaming: true },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', name: 'Llama 3.1 8B Turbo', provider: AIProvider.Together, maxTokens: 8192, supportsStreaming: true },
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', provider: AIProvider.Together, maxTokens: 32768, supportsStreaming: true },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', provider: AIProvider.Together, maxTokens: 32768, supportsStreaming: true },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'Deepseek R1 Distill 70B', provider: AIProvider.Together, maxTokens: 8192, supportsStreaming: true },
    ],
  },
  [AIProvider.Mistral]: {
    id: AIProvider.Mistral,
    name: 'Mistral AI',
    description: 'Mistral and Codestral models',
    baseUrl: 'https://api.mistral.ai',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'your-api-key',
    apiKeyLink: 'https://console.mistral.ai/api-keys/',
    openaiCompatible: true,
    defaultModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large', provider: AIProvider.Mistral, maxTokens: 128000, supportsStreaming: true },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: AIProvider.Mistral, maxTokens: 32000, supportsStreaming: true },
      { id: 'mistral-small-latest', name: 'Mistral Small', provider: AIProvider.Mistral, maxTokens: 32000, supportsStreaming: true },
      { id: 'codestral-latest', name: 'Codestral', provider: AIProvider.Mistral, maxTokens: 32000, supportsStreaming: true },
    ],
  },
  [AIProvider.Ollama]: {
    id: AIProvider.Ollama,
    name: 'Ollama (Local)',
    description: 'Run models locally with Ollama',
    baseUrl: 'http://localhost:11434',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'ollama (or leave empty)',
    openaiCompatible: true,
    supportsLocal: true,
    defaultModels: [
      { id: 'llama3.2', name: 'Llama 3.2', provider: AIProvider.Ollama, maxTokens: 8192, supportsStreaming: true },
      { id: 'codellama', name: 'Code Llama', provider: AIProvider.Ollama, maxTokens: 16384, supportsStreaming: true },
      { id: 'deepseek-coder-v2', name: 'Deepseek Coder V2', provider: AIProvider.Ollama, maxTokens: 16384, supportsStreaming: true },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', provider: AIProvider.Ollama, maxTokens: 32768, supportsStreaming: true },
      { id: 'mistral', name: 'Mistral', provider: AIProvider.Ollama, maxTokens: 8192, supportsStreaming: true },
    ],
  },
  [AIProvider.OpenRouter]: {
    id: AIProvider.OpenRouter,
    name: 'OpenRouter',
    description: 'Access multiple providers through one API',
    baseUrl: 'https://openrouter.ai/api',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyLink: 'https://openrouter.ai/keys',
    openaiCompatible: true,
    defaultModels: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: AIProvider.OpenRouter, maxTokens: 200000, supportsStreaming: true },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: AIProvider.OpenRouter, maxTokens: 128000, supportsStreaming: true },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: AIProvider.OpenRouter, maxTokens: 1000000, supportsStreaming: true },
      { id: 'deepseek/deepseek-chat', name: 'Deepseek Chat', provider: AIProvider.OpenRouter, maxTokens: 64000, supportsStreaming: true },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: AIProvider.OpenRouter, maxTokens: 8192, supportsStreaming: true },
    ],
  },
  [AIProvider.Perplexity]: {
    id: AIProvider.Perplexity,
    name: 'Perplexity',
    description: 'AI with real-time web search capabilities',
    baseUrl: 'https://api.perplexity.ai',
    endpoint: '/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'pplx-...',
    apiKeyLink: 'https://www.perplexity.ai/settings/api',
    openaiCompatible: true,
    defaultModels: [
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large (Online)', provider: AIProvider.Perplexity, maxTokens: 128000, supportsStreaming: true },
      { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small (Online)', provider: AIProvider.Perplexity, maxTokens: 128000, supportsStreaming: true },
      { id: 'llama-3.1-sonar-large-128k-chat', name: 'Sonar Large (Chat)', provider: AIProvider.Perplexity, maxTokens: 128000, supportsStreaming: true },
    ],
  },
  [AIProvider.Custom]: {
    id: AIProvider.Custom,
    name: 'Custom API',
    description: 'Configure your own OpenAI-compatible endpoint',
    baseUrl: '',
    endpoint: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    apiKeyPlaceholder: 'your-api-key',
    openaiCompatible: true,
    defaultModels: [],
  },
};

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
  /** Provider configurations - supports all providers */
  providers: Partial<Record<AIProvider, AIProviderConfig>>;
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
 * Helper to get all available provider IDs
 */
export function getAvailableProviders(): AIProvider[] {
  return Object.values(AIProvider);
}

/**
 * Helper to get provider template by ID
 */
export function getProviderTemplate(provider: AIProvider): AIProviderTemplate {
  return AI_PROVIDER_TEMPLATES[provider];
}

/**
 * Helper to get models for a provider
 */
export function getProviderModels(provider: AIProvider): AIModel[] {
  const template = AI_PROVIDER_TEMPLATES[provider];
  if (template.defaultModels.length > 0) {
    return template.defaultModels;
  }
  // Fall back to KNOWN_MODELS for OpenAI and Anthropic
  return KNOWN_MODELS.filter(m => m.provider === provider);
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
