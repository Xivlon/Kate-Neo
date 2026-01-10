/**
 * Excalidraw Editor Component
 *
 * Whiteboard-style diagram editor using Excalidraw
 * Supports freehand drawing, shapes, text, and collaboration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Moon,
  Sun,
  Grid,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Excalidraw element types
interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  [key: string]: unknown;
}

interface ExcalidrawAppState {
  viewBackgroundColor: string;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemFillStyle: string;
  currentItemStrokeWidth: number;
  currentItemRoughness: number;
  currentItemOpacity: number;
  zoom: { value: number };
  scrollX: number;
  scrollY: number;
  theme: 'light' | 'dark';
  gridSize: number | null;
}

interface ExcalidrawData {
  elements: ExcalidrawElement[];
  appState: Partial<ExcalidrawAppState>;
  files?: Record<string, { mimeType: string; id: string; dataURL: string }>;
}

interface ExcalidrawEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

// Default empty canvas state
const DEFAULT_DATA: ExcalidrawData = {
  elements: [],
  appState: {
    viewBackgroundColor: '#1e1e1e',
    theme: 'dark',
    gridSize: null,
  },
};

export function ExcalidrawEditor({
  content,
  onChange,
  readOnly = false
}: ExcalidrawEditorProps) {
  const [data, setData] = useState<ExcalidrawData>(DEFAULT_DATA);
  const [ExcalidrawComponent, setExcalidrawComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showGrid, setShowGrid] = useState(false);
  const excalidrawRef = useRef<any>(null);

  // Parse content on mount/change
  useEffect(() => {
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setData(parsed);
        setTheme(parsed.appState?.theme || 'dark');
      } catch {
        // If not valid JSON, use default
        setData(DEFAULT_DATA);
      }
    } else {
      setData(DEFAULT_DATA);
    }
  }, [content]);

  // Dynamically load Excalidraw
  useEffect(() => {
    const loadExcalidraw = async () => {
      try {
        setIsLoading(true);
        // Note: In a real implementation, you'd install @excalidraw/excalidraw
        // For now, we'll create a placeholder that shows the structure
        const module = await import('@excalidraw/excalidraw').catch(() => null);

        if (module) {
          setExcalidrawComponent(() => module.Excalidraw);
        } else {
          // Fallback to placeholder
          setError('Excalidraw not installed. Run: npm install @excalidraw/excalidraw');
        }
      } catch (err) {
        setError('Failed to load Excalidraw');
      } finally {
        setIsLoading(false);
      }
    };

    loadExcalidraw();
  }, []);

  const handleChange = useCallback((
    elements: readonly ExcalidrawElement[],
    appState: ExcalidrawAppState,
    files: any
  ) => {
    const newData: ExcalidrawData = {
      elements: [...elements],
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        theme: appState.theme,
        gridSize: appState.gridSize,
      },
      files,
    };

    setData(newData);

    if (onChange) {
      onChange(JSON.stringify(newData, null, 2));
    }
  }, [onChange]);

  const handleExportSVG = async () => {
    if (!excalidrawRef.current) return;

    try {
      const svg = await excalidrawRef.current.exportToSvg({
        elements: data.elements,
        appState: data.appState,
      });

      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'excalidraw.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  const handleExportPNG = async () => {
    if (!excalidrawRef.current) return;

    try {
      const blob = await excalidrawRef.current.exportToBlob({
        elements: data.elements,
        appState: data.appState,
        mimeType: 'image/png',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'excalidraw.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleClear = () => {
    setData(DEFAULT_DATA);
    onChange?.(JSON.stringify(DEFAULT_DATA, null, 2));
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setData(prev => ({
      ...prev,
      appState: {
        ...prev.appState,
        theme: newTheme,
        viewBackgroundColor: newTheme === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    }));
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    setData(prev => ({
      ...prev,
      appState: {
        ...prev.appState,
        gridSize: showGrid ? null : 20,
      },
    }));
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (!excalidrawRef.current) return;

    const api = excalidrawRef.current;
    const currentZoom = api.getAppState().zoom.value;

    let newZoom: number;
    switch (direction) {
      case 'in':
        newZoom = Math.min(currentZoom * 1.25, 5);
        break;
      case 'out':
        newZoom = Math.max(currentZoom * 0.8, 0.1);
        break;
      case 'reset':
        newZoom = 1;
        break;
    }

    api.updateScene({
      appState: {
        zoom: { value: newZoom },
      },
    });
  };

  // Render placeholder if Excalidraw is not available
  const renderPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Excalidraw Canvas</h3>
        <p className="text-muted-foreground mb-4">
          {error || 'Interactive whiteboard for sketching diagrams and illustrations'}
        </p>
        {error && (
          <code className="block p-2 bg-card rounded text-xs text-left mb-4">
            npm install @excalidraw/excalidraw
          </code>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Shapes</span>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Freehand</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Text</span>
          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">Arrows</span>
          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">Images</span>
        </div>
      </div>

      {/* Show raw JSON editor as fallback */}
      <div className="mt-8 w-full max-w-2xl">
        <p className="text-xs text-muted-foreground mb-2">Raw JSON Data:</p>
        <textarea
          value={content || JSON.stringify(DEFAULT_DATA, null, 2)}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full h-48 p-4 bg-card border border-border rounded-lg font-mono text-xs resize-none"
          readOnly={readOnly}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange?.(JSON.stringify(data, null, 2))}
          title="Save"
        >
          <Save className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <Select
          defaultValue="svg"
          onValueChange={(v) => v === 'svg' ? handleExportSVG() : handleExportPNG()}
        >
          <SelectTrigger className="w-24 h-8">
            <Download className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Export" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="svg">SVG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-8 w-8" title="Import">
          <Upload className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleZoom('out')}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleZoom('reset')}
          title="Reset Zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleZoom('in')}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${showGrid ? 'bg-accent' : ''}`}
          onClick={handleToggleGrid}
          title="Toggle Grid"
        >
          <Grid className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleClear}
          title="Clear Canvas"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Canvas Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : ExcalidrawComponent ? (
        <div className="flex-1">
          <ExcalidrawComponent
            ref={excalidrawRef}
            initialData={data}
            onChange={handleChange}
            theme={theme}
            gridModeEnabled={showGrid}
            viewModeEnabled={readOnly}
            UIOptions={{
              canvasActions: {
                loadScene: true,
                export: true,
                saveAsImage: true,
              },
            }}
          />
        </div>
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
}

export type { ExcalidrawData, ExcalidrawElement };
