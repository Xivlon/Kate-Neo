/**
 * AI Service
 * 
 * Manages AI API integrations for code assistance and chat functionality.
 * Supports OpenAI, Anthropic, and custom API endpoints.
 */

import { EventEmitter } from 'events';
import {
  AIProvider,
  AISettings,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  CodeAssistanceRequest,
  CodeAssistanceResponse,
  AIProviderConfig,
  AIModel,
  KNOWN_MODELS,
} from '../../shared/ai-types.js';

/**
 * AI Service for handling AI API requests
 */
export class AIService extends EventEmitter {
  private settings: AISettings | null = null;
  private initialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize the AI service with settings
   */
  async initialize(settings: AISettings): Promise<void> {
    this.settings = settings;
    this.initialized = true;
    console.log('[AIService] Initialized with provider:', settings.activeProvider);
  }

  /**
   * Update AI settings
   */
  updateSettings(settings: AISettings): void {
    this.settings = settings;
    this.emit('settingsChanged', settings);
    console.log('[AIService] Settings updated');
  }

  /**
   * Get current settings
   */
  getSettings(): AISettings | null {
    return this.settings;
  }

  /**
   * Check if AI service is enabled
   */
  isEnabled(): boolean {
    return this.settings?.enabled ?? false;
  }

  /**
   * Get available models for the active provider
   */
  getAvailableModels(): AIModel[] {
    if (!this.settings) return [];

    const provider = this.settings.activeProvider;
    const providerConfig = this.settings.providers[provider];

    if (providerConfig?.models && providerConfig.models.length > 0) {
      return providerConfig.models;
    }

    // Return default models for known providers
    return KNOWN_MODELS.filter(m => m.provider === provider);
  }

  /**
   * Send a chat completion request
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.settings || !this.settings.enabled) {
      return {
        success: false,
        error: 'AI service is not enabled',
      };
    }

    const provider = this.settings.activeProvider;
    const providerConfig = this.settings.providers[provider];

    if (!providerConfig || !providerConfig.enabled) {
      return {
        success: false,
        error: `Provider ${provider} is not configured or enabled`,
      };
    }

    try {
      switch (provider) {
        case AIProvider.OpenAI:
          return await this.openAIChatCompletion(request, providerConfig);
        case AIProvider.Anthropic:
          return await this.anthropicChatCompletion(request, providerConfig);
        case AIProvider.Custom:
          return await this.customChatCompletion(request, providerConfig);
        default:
          return {
            success: false,
            error: `Unsupported provider: ${provider}`,
          };
      }
    } catch (error) {
      console.error('[AIService] Chat completion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * OpenAI chat completion
   */
  private async openAIChatCompletion(
    request: ChatCompletionRequest,
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    const model = request.model || config.defaultModel || 'gpt-3.5-turbo';
    const temperature = request.temperature ?? this.settings?.temperature ?? 0.7;
    const maxTokens = request.maxTokens ?? this.settings?.maxResponseTokens ?? 2000;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: false, // TODO: Implement streaming support
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.choices[0].message.content,
      timestamp: Date.now(),
      model,
    };

    return {
      success: true,
      message,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  /**
   * Anthropic chat completion
   */
  private async anthropicChatCompletion(
    request: ChatCompletionRequest,
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    const model = request.model || config.defaultModel || 'claude-3-sonnet-20240229';
    const temperature = request.temperature ?? this.settings?.temperature ?? 0.7;
    const maxTokens = request.maxTokens ?? this.settings?.maxResponseTokens ?? 2000;

    // Separate system messages from other messages
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        system: systemMessage?.content ?? this.settings?.systemPrompt,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.content[0].text,
      timestamp: Date.now(),
      model,
    };

    return {
      success: true,
      message,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  }

  /**
   * Custom API chat completion
   */
  private async customChatCompletion(
    request: ChatCompletionRequest,
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    if (!config.customConfig) {
      throw new Error('Custom API configuration is missing');
    }

    const { baseUrl, endpoint = '/v1/chat/completions', authHeader = 'Authorization', headers = {} } = config.customConfig;
    const model = request.model || config.defaultModel || 'default';
    const temperature = request.temperature ?? this.settings?.temperature ?? 0.7;
    const maxTokens = request.maxTokens ?? this.settings?.maxResponseTokens ?? 2000;

    const url = `${baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (config.apiKey) {
      requestHeaders[authHeader] = authHeader.toLowerCase() === 'authorization' 
        ? `Bearer ${config.apiKey}`
        : config.apiKey;
    }

    // Use OpenAI-compatible format if specified or by default
    const requestBody = config.customConfig.format === 'openai' || !config.customConfig.format
      ? {
          model,
          messages: request.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature,
          max_tokens: maxTokens,
        }
      : {
          // Custom format - can be extended based on needs
          prompt: request.messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
          temperature,
          max_tokens: maxTokens,
        };

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    // Try to parse OpenAI-compatible response
    let content: string;
    if (data.choices && data.choices[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else if (data.response) {
      content = data.response;
    } else if (data.content) {
      content = data.content;
    } else {
      content = JSON.stringify(data);
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
      model,
    };

    return {
      success: true,
      message,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      } : undefined,
    };
  }

  /**
   * Request code assistance
   */
  async codeAssistance(request: CodeAssistanceRequest): Promise<CodeAssistanceResponse> {
    if (!this.settings || !this.settings.enabled) {
      return {
        success: false,
        error: 'AI service is not enabled',
      };
    }

    // Build prompt based on request type
    let prompt = '';
    switch (request.type) {
      case 'explain':
        prompt = `Explain the following ${request.language || 'code'}:\n\n${request.code}`;
        break;
      case 'improve':
        prompt = `Improve the following ${request.language || 'code'}. Provide the improved version:\n\n${request.code}`;
        break;
      case 'fix':
        prompt = `Fix any bugs or issues in the following ${request.language || 'code'}:\n\n${request.code}`;
        break;
      case 'comment':
        prompt = `Add helpful comments to the following ${request.language || 'code'}:\n\n${request.code}`;
        break;
      case 'test':
        prompt = `Generate unit tests for the following ${request.language || 'code'}:\n\n${request.code}`;
        break;
      case 'custom':
        prompt = request.instruction 
          ? `${request.instruction}\n\n${request.code}`
          : request.code;
        break;
    }

    const messages: ChatMessage[] = [
      {
        id: crypto.randomUUID(),
        role: 'system',
        content: this.settings.systemPrompt || 'You are a helpful AI coding assistant.',
        timestamp: Date.now(),
      },
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      },
    ];

    const response = await this.chatCompletion({ messages });

    if (!response.success || !response.message) {
      return {
        success: false,
        error: response.error || 'Failed to get AI response',
      };
    }

    return {
      success: true,
      result: response.message.content,
    };
  }

  /**
   * Test API connection
   */
  async testConnection(provider?: AIProvider): Promise<{ success: boolean; error?: string }> {
    if (!this.settings) {
      return { success: false, error: 'AI service not initialized' };
    }

    const testProvider = provider || this.settings.activeProvider;
    const config = this.settings.providers[testProvider];

    if (!config || !config.enabled) {
      return { success: false, error: 'Provider not configured or enabled' };
    }

    try {
      const testMessages: ChatMessage[] = [
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: 'Say "OK" if you can read this.',
          timestamp: Date.now(),
        },
      ];

      const response = await this.chatCompletion({ 
        messages: testMessages,
        maxTokens: 10,
      });

      return response.success 
        ? { success: true }
        : { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

// Singleton instance
export const aiService = new AIService();
