import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, Copy, Check, Plus, Trash2, MessageSquare, FileCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/contexts/AIContext';
import { cn } from '@/lib/utils';

interface AIAssistantPanelProps {
  visible?: boolean;
}

export function AIAssistantPanel({ visible = true }: AIAssistantPanelProps) {
  const {
    conversations,
    activeConversationId,
    messages,
    aiEnabled,
    availableModels,
    selectedModel,
    isLoading,
    editorContext,
    sendMessage,
    clearChat,
    setSelectedModel,
    createNewConversation,
    switchConversation,
    deleteConversation,
  } = useAI();

  const [input, setInput] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!aiEnabled) {
      toast({
        title: 'AI Disabled',
        description: 'Please enable and configure AI in Settings > AI',
        variant: 'destructive',
      });
      return;
    }

    const message = input.trim();
    setInput('');
    await sendMessage(message, includeContext);
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

  // Format code blocks in messages
  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0] || '';
        const code = lines.slice(1).join('\n');
        return (
          <pre key={index} className="bg-background/50 rounded p-2 my-2 overflow-x-auto text-xs">
            {language && <div className="text-muted-foreground text-[10px] mb-1">{language}</div>}
            <code>{code}</code>
          </pre>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-semibold text-sm truncate">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowConversations(!showConversations)}
            title="Conversations"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={createNewConversation}
            title="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={clearChat}
            disabled={messages.length === 0}
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Model selector */}
      {availableModels.length > 0 && (
        <div className="px-2 py-1.5 border-b">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conversation list (collapsible) */}
      {showConversations && conversations.length > 0 && (
        <div className="border-b max-h-32 overflow-y-auto">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => {
                switchConversation(conv.id);
                setShowConversations(false);
              }}
              className={cn(
                "w-full px-2 py-1.5 text-left text-xs hover:bg-accent flex items-center justify-between gap-2",
                conv.id === activeConversationId && "bg-accent"
              )}
            >
              <span className="truncate">{conv.title || 'New Chat'}</span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Editor context indicator */}
      {editorContext.filePath && (
        <div className="px-2 py-1 border-b bg-accent/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
            <FileCode className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{editorContext.fileName}</span>
            {editorContext.selection && (
              <span className="text-[10px] bg-primary/20 px-1 rounded">selection</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-5 px-1.5 text-[10px]",
              includeContext ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setIncludeContext(!includeContext)}
            title={includeContext ? "Context will be included" : "Context will not be included"}
          >
            {includeContext ? "Include" : "Exclude"}
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-2" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-3" />
            <p className="text-xs text-center">Start a conversation with AI</p>
            {editorContext.filePath && (
              <p className="text-[10px] mt-2 text-center">
                Context from <span className="text-primary">{editorContext.fileName}</span> will be included
              </p>
            )}
            {!aiEnabled && (
              <p className="text-[10px] mt-2 text-destructive text-center">
                AI not configured. Check Settings &gt; AI
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-lg p-2 text-xs",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 whitespace-pre-wrap break-words overflow-hidden">
                      {message.role === 'assistant' ? formatMessage(message.content) : message.content}
                    </div>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 flex-shrink-0"
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
                    <div className="text-[10px] text-muted-foreground mt-1 opacity-70">
                      {message.model}
                    </div>
                  )}
                  {message.error && (
                    <div className="text-[10px] text-destructive mt-1">
                      Error: {message.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={aiEnabled ? "Ask about the code..." : "Configure AI in Settings first..."}
            disabled={!aiEnabled || isLoading}
            className="min-h-[50px] max-h-[120px] resize-none text-xs"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!aiEnabled || !input.trim() || isLoading}
            size="sm"
            className="self-end h-8 w-8 p-0"
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
