import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Settings, Loader2, Copy, Check, Code, FileCode, Wand2, RefreshCw, Plus, FolderOpen, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, AIModel } from '../../../../shared/ai-types';
import type { AgentTaskRequest, AgentTaskResponse, AgentSettings, AgentMode } from '../../../../shared/agent-types';

interface AIAssistantPanelProps {
  visible?: boolean;
}

export function AIAssistantPanel({ visible = true }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Agent mode state
  const [agentMode, setAgentMode] = useState<AgentMode>('chat');
  const [agentSettings, setAgentSettings] = useState<AgentSettings | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [currentTask, setCurrentTask] = useState<AgentTaskResponse | null>(null);
  const [contextFiles, setContextFiles] = useState<string[]>([]);

  // Fetch AI status and agent settings on mount
  useEffect(() => {
    fetchAIStatus();
    fetchAgentSettings();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiEnabled(data.enabled);
      setActiveProvider(data.provider);
      setAvailableModels(data.models || []);
      if (data.models && data.models.length > 0) {
        setSelectedModel(data.models[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!aiEnabled) {
      toast({
        title: 'AI Disabled',
        description: 'Please enable and configure AI in Settings > AI',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // In Agent Mode, use agent execution
      if (agentMode === 'agent') {
        await executeAgentFromInput(currentInput);
      } else {
        // In Chat Mode, use regular chat API
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: selectedModel || undefined,
          }),
        });

        const data = await response.json();

        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message]);
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to get AI response',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to communicate with AI service',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse user input and execute appropriate agent task
  const executeAgentFromInput = async (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    // Determine task type from user input
    let taskType: AgentTaskRequest['type'] = 'multi_step_task';

    if (lowerInput.includes('generate') || lowerInput.includes('create')) {
      taskType = 'generate_code';
    } else if (lowerInput.includes('refactor') || lowerInput.includes('improve')) {
      taskType = 'refactor';
    } else if (lowerInput.includes('fix') || lowerInput.includes('bug')) {
      taskType = 'modify_code';
    } else if (lowerInput.includes('list') || lowerInput.includes('show files')) {
      taskType = 'list_files';
    } else if (lowerInput.includes('read') && lowerInput.includes('file')) {
      taskType = 'read_file';
    } else if (lowerInput.includes('analyze') || lowerInput.includes('structure')) {
      taskType = 'analyze_project';
    }

    const request: AgentTaskRequest = {
      type: taskType,
      description: userInput,
      files: contextFiles.length > 0 ? contextFiles : undefined,
    };

    await executeAgentTask(request);
  };

  const clearChat = () => {
    setMessages([]);
    setGeneratedCode('');
    setCurrentTask(null);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: 'Copied',
        description: 'Message copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Fetch agent settings
  const fetchAgentSettings = async () => {
    try {
      const response = await fetch('/api/agent/settings');
      const data = await response.json();
      if (data.success) {
        setAgentSettings(data.settings);
        setAgentMode(data.settings.mode || 'chat');
      }
    } catch (error) {
      console.error('Failed to fetch agent settings:', error);
    }
  };

  // Execute agent task
  const executeAgentTask = async (request: AgentTaskRequest) => {
    setIsLoading(true);
    setCurrentTask(null);

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: AgentTaskResponse = await response.json();

      if (data.success) {
        setCurrentTask(data);
        if (data.generatedCode) {
          setGeneratedCode(data.generatedCode);
        }

        // Add result to chat
        const resultMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: formatAgentResponse(data),
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, resultMessage]);

        toast({
          title: 'Task Completed',
          description: `${request.type} completed successfully`,
        });
      } else {
        toast({
          title: 'Task Failed',
          description: data.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute agent task',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format agent response for display
  const formatAgentResponse = (response: AgentTaskResponse): string => {
    let content = '';

    if (response.steps && response.steps.length > 0) {
      content += 'Task Steps:\n';
      response.steps.forEach((step, i) => {
        content += `${i + 1}. ${step.description} - ${step.status}\n`;
      });
      content += '\n';
    }

    if (response.generatedCode) {
      const maxPreviewLength = 500;
      let previewCode = response.generatedCode;

      if (response.generatedCode.length > maxPreviewLength) {
        const slice = response.generatedCode.slice(0, maxPreviewLength);
        const lastNewline = slice.lastIndexOf('\n');
        // Prefer truncating at the last full line before the limit, if available.
        previewCode = lastNewline > 0 ? slice.slice(0, lastNewline) : slice;
      }

      content += 'Generated Code:\n```\n' + previewCode;
      if (response.generatedCode.length > maxPreviewLength) {
        content += '\n... (truncated, see Code Preview)';
      }
      content += '\n```\n';
    }

    if (response.modifiedFiles && response.modifiedFiles.length > 0) {
      content += `\nModified Files: ${response.modifiedFiles.join(', ')}`;
    }

    if (response.result) {
      if (typeof response.result === 'object') {
        if (response.result.plan) {
          content += '\nTask Plan:\n' + response.result.plan;
        } else if (response.result.files) {
          content += `\nFound ${response.result.files.length} files`;
        }
      }
    }

    return content || 'Task completed successfully';
  };

  // Quick actions for common agent tasks
  const handleQuickAction = async (action: string) => {
    if (!aiEnabled) {
      toast({
        title: 'AI Disabled',
        description: 'Please enable and configure AI in Settings',
        variant: 'destructive',
      });
      return;
    }

    // Set contextual prompts based on action type
    switch (action) {
      case 'generate':
        setInput('Generate a ');
        break;
      case 'refactor':
        setInput('Refactor ');
        break;
      case 'explain':
        // Execute analysis task directly
        if (contextFiles.length === 0) {
          setInput('Explain ');
        } else {
          await executeQuickTask('analyze_project', 'Analyze and explain the project structure and architecture');
        }
        break;
      case 'fix':
        setInput('Fix ');
        break;
      case 'test':
        setInput('Generate tests for ');
        break;
      case 'list':
        // Execute list files directly
        await executeQuickTask('list_files', 'List project files');
        break;
    }
  };

  // Execute a quick task directly
  const executeQuickTask = async (taskType: AgentTaskRequest['type'], description: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: description,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    const request: AgentTaskRequest = {
      type: taskType,
      description,
      files: contextFiles.length > 0 ? contextFiles : undefined,
    };

    await executeAgentTask(request);
  };

  // Toggle agent mode
  const toggleAgentMode = () => {
    const newMode: AgentMode = agentMode === 'chat' ? 'agent' : 'chat';
    setAgentMode(newMode);

    // Update settings on backend
    fetch('/api/agent/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: newMode }),
    }).catch(error => {
      console.error('Failed to update agent mode:', error);
    });
  };

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold">AI Assistant</span>
          <Badge variant={agentMode === 'agent' ? 'default' : 'outline'} className="text-xs">
            {agentMode === 'agent' ? 'Agent Mode' : 'Chat Mode'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {availableModels.length > 0 && (
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant={agentMode === 'agent' ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleAgentMode}
            title="Toggle Agent Mode"
          >
            <Terminal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Quick Actions (Agent Mode) */}
      {agentMode === 'agent' && aiEnabled && (
        <div className="p-2 border-b bg-muted/30 space-y-2">
          <div className="flex flex-wrap gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('generate')}
            >
              <Code className="h-3 w-3 mr-1" />
              Generate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('refactor')}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refactor
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('explain')}
            >
              <FileCode className="h-3 w-3 mr-1" />
              Explain
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('fix')}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Fix
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('test')}
            >
              <Plus className="h-3 w-3 mr-1" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleQuickAction('list')}
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              List Files
            </Button>
          </div>
          {contextFiles.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Context:</span>
              {contextFiles.map((file, i) => (
                <Badge key={i} variant="secondary" className="text-xs h-5">
                  {file.split('/').pop()}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs"
                onClick={() => setContextFiles([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-4" />
            <p className="text-sm">Start a conversation with the AI assistant</p>
            {!aiEnabled && (
              <p className="text-xs mt-2 text-destructive">
                AI is not configured. Check Settings {'>'} AI
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  {message.model && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.model}
                    </div>
                  )}
                  {message.error && (
                    <div className="text-xs text-destructive mt-1">
                      Error: {message.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Code Preview (Agent Mode) */}
      {agentMode === 'agent' && generatedCode && (
        <div className="border-t border-border bg-muted/20 max-h-[200px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Code className="h-3 w-3" />
              <span className="text-xs font-medium">Generated Code</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => copyToClipboard(generatedCode, 'code-preview')}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setGeneratedCode('')}
              >
                Close
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 p-2">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
              {generatedCode}
            </pre>
          </ScrollArea>
        </div>
      )}

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              agentMode === 'agent' && aiEnabled
                ? "Describe what you want to build..."
                : aiEnabled
                ? "Ask me anything..."
                : "Configure AI in Settings first..."
            }
            disabled={!aiEnabled || isLoading}
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={sendMessage}
            disabled={!aiEnabled || !input.trim() || isLoading}
            size="sm"
            className="self-end"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
