/**
 * Mermaid Preview Component
 *
 * Renders Mermaid diagrams with live preview
 * Supports flowcharts, sequence diagrams, class diagrams, etc.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Download, ZoomIn, ZoomOut, Maximize2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MermaidPreviewProps {
  content: string;
  onChange?: (content: string) => void;
  splitView?: boolean;
}

type MermaidTheme = 'default' | 'dark' | 'forest' | 'neutral';

// Mermaid diagram templates
const DIAGRAM_TEMPLATES: Record<string, string> = {
  flowchart: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,

  sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,

  classDiagram: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

  stateDiagram: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,

  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        date created
    }`,

  gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1, 20d
    section Another
    Task in sec      :2024-01-12, 12d
    another task     :24d`,

  pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,

  journey: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`,

  gitGraph: `gitgraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`,
};

export function MermaidPreview({
  content,
  onChange,
  splitView = true
}: MermaidPreviewProps) {
  const [rendered, setRendered] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState<MermaidTheme>('dark');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Initialize mermaid dynamically
  const renderDiagram = useCallback(async () => {
    if (!content.trim()) {
      setRendered('');
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import of mermaid
      const mermaid = (await import('mermaid')).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: 'loose',
        fontFamily: 'monospace',
      });

      const { svg } = await mermaid.render('mermaid-preview', content);
      setRendered(svg);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
      setError(errorMessage);
      setRendered('');
    } finally {
      setIsLoading(false);
    }
  }, [content, theme]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [renderDiagram]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  const handleDownloadSVG = () => {
    if (!rendered) return;

    const blob = new Blob([rendered], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!rendered || !containerRef.current) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'diagram.png';
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertTemplate = (templateKey: string) => {
    if (onChange && DIAGRAM_TEMPLATES[templateKey]) {
      onChange(DIAGRAM_TEMPLATES[templateKey]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
        <Select value={theme} onValueChange={(v) => setTheme(v as MermaidTheme)}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="forest">Forest</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handleInsertTemplate}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flowchart">Flowchart</SelectItem>
            <SelectItem value="sequence">Sequence</SelectItem>
            <SelectItem value="classDiagram">Class Diagram</SelectItem>
            <SelectItem value="stateDiagram">State Diagram</SelectItem>
            <SelectItem value="erDiagram">ER Diagram</SelectItem>
            <SelectItem value="gantt">Gantt Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
            <SelectItem value="journey">User Journey</SelectItem>
            <SelectItem value="gitGraph">Git Graph</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyCode}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownloadSVG}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={renderDiagram}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content Area */}
      <div className={`flex-1 flex ${splitView ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Editor */}
        {splitView && (
          <div className="flex-1 border-r border-border">
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full h-full p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
              placeholder="Enter your Mermaid diagram code here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div
              ref={containerRef}
              className="p-4 flex items-center justify-center min-h-full"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Rendering...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-w-lg">
                  <h4 className="text-destructive font-medium mb-2">Syntax Error</h4>
                  <pre className="text-xs text-destructive/80 whitespace-pre-wrap">{error}</pre>
                </div>
              ) : rendered ? (
                <div
                  className="mermaid-container"
                  dangerouslySetInnerHTML={{ __html: rendered }}
                />
              ) : (
                <div className="text-muted-foreground text-center">
                  <p className="mb-2">No diagram to display</p>
                  <p className="text-xs">Enter Mermaid code or select a template</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// Export templates for use elsewhere
export { DIAGRAM_TEMPLATES };
