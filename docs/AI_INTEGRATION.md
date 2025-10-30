# AI API Integration

Kate Neo IDE now includes comprehensive AI assistant capabilities with support for multiple AI providers including OpenAI, Anthropic, and custom API endpoints.

## Features

### Supported AI Providers

1. **OpenAI** - GPT-3.5, GPT-4, GPT-4 Turbo
2. **Anthropic** - Claude 3 Opus, Sonnet, and Haiku
3. **Custom API** - Integrate any OpenAI-compatible or custom API endpoint

### Capabilities

- **Chat Interface**: Interactive conversation with AI assistant in dedicated panel
- **Code Assistance**: 
  - Code explanation
  - Code improvement suggestions
  - Bug fixing
  - Comment generation
  - Unit test generation
  - Custom instructions
- **Multiple Models**: Switch between different AI models per provider
- **Streaming Support**: Real-time response streaming (configurable)
- **Context Management**: Maintains conversation history for better context
- **Configurable Parameters**: Temperature, max tokens, system prompts

## Setup

### 1. Access AI Settings

Navigate to **Settings > AI** tab in the IDE settings panel.

### 2. Enable AI Assistant

Toggle "Enable AI Assistant" to activate the feature.

### 3. Configure Provider

#### OpenAI

1. Select "OpenAI" as the active provider
2. Enter your OpenAI API key (obtain from https://platform.openai.com/api-keys)
3. Choose a default model (GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo)
4. Enable the OpenAI provider

#### Anthropic

1. Select "Anthropic" as the active provider
2. Enter your Anthropic API key (obtain from https://console.anthropic.com/)
3. Choose a default model (Claude 3 Opus, Sonnet, or Haiku)
4. Enable the Anthropic provider

#### Custom API

1. Select "Custom" as the active provider
2. Enter your API key (if required)
3. Provide the base URL (e.g., `https://api.yourservice.com`)
4. Optionally specify the endpoint path (defaults to `/v1/chat/completions`)
5. Choose API format:
   - **OpenAI Compatible**: For services that implement OpenAI's API format
   - **Custom**: For custom API implementations
6. Enable the Custom provider

### 4. Adjust Parameters (Optional)

- **Temperature**: Controls response randomness (0 = deterministic, 2 = very creative)
- **Max Response Tokens**: Maximum length of AI responses
- **System Prompt**: Customize the AI's behavior and personality

## Usage

### Chat Interface

1. Open the **AI** tab in the left sidebar
2. Type your question or request in the input field
3. Press Enter or click Send
4. View AI responses in the conversation panel
5. Switch models using the dropdown at the top of the panel

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message

### Chat Features

- **Copy Responses**: Click the copy icon on AI messages
- **Clear Chat**: Clear conversation history
- **Model Selection**: Choose different models per conversation

## API Integration Details

### OpenAI Integration

Kate Neo uses the OpenAI Chat Completions API:

```typescript
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### Anthropic Integration

Kate Neo uses the Anthropic Messages API:

```typescript
POST https://api.anthropic.com/v1/messages
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01
Content-Type: application/json

{
  "model": "claude-3-sonnet-20240229",
  "messages": [...],
  "system": "You are a helpful AI assistant...",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### Custom API Integration

For custom APIs, Kate Neo supports two formats:

#### OpenAI-Compatible Format

If your API implements OpenAI's format:

```typescript
POST https://your-api.com/v1/chat/completions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "model": "your-model",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

#### Custom Format

For custom implementations, Kate Neo sends:

```typescript
POST https://your-api.com/your-endpoint
Your-Auth-Header: YOUR_API_KEY
Content-Type: application/json

{
  "prompt": "user: message\n\nassistant: response...",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

The service expects a response with a `response`, `content`, or OpenAI-compatible structure.

## Backend API Endpoints

### Get AI Status

```http
GET /api/ai/status
```

Returns current AI configuration and available models.

### Send Chat Message

```http
POST /api/ai/chat
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Your message" }
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

### Code Assistance

```http
POST /api/ai/code-assistance
Content-Type: application/json

{
  "type": "explain|improve|fix|comment|test|custom",
  "code": "function example() { ... }",
  "language": "javascript",
  "instruction": "Custom instruction for type=custom"
}
```

### Test Connection

```http
POST /api/ai/test-connection
Content-Type: application/json

{
  "provider": "openai|anthropic|custom"
}
```

## Security

### API Key Storage

- API keys are stored in settings files
- Global settings: `~/.kate-neo/settings.json`
- Workspace settings: `.kate-neo/settings.json` in workspace root
- **Important**: Add `.kate-neo/` to your `.gitignore` to prevent committing API keys

### Best Practices

1. Never commit API keys to version control
2. Use workspace-scoped settings for project-specific configurations
3. Rotate API keys regularly
4. Use environment-specific keys (dev vs. production)

## Troubleshooting

### AI Assistant Not Working

1. Check that AI is enabled in Settings > AI
2. Verify your API key is correctly entered
3. Ensure the selected provider is enabled
4. Check browser console for error messages

### Connection Errors

1. Verify your API key is valid
2. Check your internet connection
3. For custom APIs, verify the base URL and endpoint
4. Test the connection using the test-connection endpoint

### Rate Limiting

If you encounter rate limiting errors:
1. Reduce request frequency
2. Use a lower-tier model (e.g., GPT-3.5 instead of GPT-4)
3. Implement request queuing in your workflow

## Advanced Configuration

### Custom Headers

For custom APIs requiring additional headers:

```typescript
// In settings
{
  "ai": {
    "providers": {
      "custom": {
        "customConfig": {
          "headers": {
            "X-Custom-Header": "value",
            "X-API-Version": "1.0"
          }
        }
      }
    }
  }
}
```

### Authentication Methods

Custom APIs support various authentication methods:
- Bearer token (default)
- Custom header name
- API key in query parameters (configure via headers)

## Future Enhancements

Planned features for future releases:

- [ ] Streaming response support
- [ ] Code context injection (current file, selected code)
- [ ] Inline code suggestions
- [ ] Refactoring suggestions
- [ ] Documentation generation
- [ ] Multi-file context
- [ ] Chat history persistence
- [ ] Export conversations
- [ ] AI-powered code search

## Contributing

To extend AI capabilities:

1. Review `shared/ai-types.ts` for type definitions
2. Extend `server/ai-service.ts` for new providers
3. Update `client/src/components/AIAssistantPanel.tsx` for UI changes
4. Add tests for new features

## Examples

### Basic Chat Usage

```typescript
// User asks
"How do I implement binary search in Python?"

// AI responds with implementation and explanation
```

### Code Improvement

```typescript
// Select code and use code assistance
const data = await fetch('/api/ai/code-assistance', {
  type: 'improve',
  code: 'function add(a,b){return a+b}',
  language: 'javascript'
});
```

### Custom Instructions

```typescript
// Use custom type for specific requests
{
  type: 'custom',
  code: 'class UserService { ... }',
  language: 'typescript',
  instruction: 'Add comprehensive error handling and logging'
}
```

## License

This AI integration feature is part of Kate Neo IDE and follows the same MIT license.

## Support

For issues, questions, or feature requests:
- Open an issue on [GitHub](https://github.com/Xivlon/Kate-Neo/issues)
- Check existing documentation
- Review API provider documentation
