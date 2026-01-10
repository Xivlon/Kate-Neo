/**
 * OpenSCAD Preview Component
 *
 * 3D preview and editing for OpenSCAD files
 * Supports live preview, parameter editing, and export
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Settings,
  Box,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  Code,
  Sliders,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface OpenSCADPreviewProps {
  content: string;
  onChange?: (content: string) => void;
  splitView?: boolean;
}

interface Parameter {
  name: string;
  value: number | string | boolean;
  type: 'number' | 'string' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
}

interface RenderState {
  status: 'idle' | 'rendering' | 'success' | 'error';
  previewImage?: string;
  errors: string[];
  warnings: string[];
  renderTime?: number;
  geometryInfo?: {
    vertices?: number;
    facets?: number;
    volume?: number;
  };
}

// OpenSCAD templates
const TEMPLATES = {
  cube: `// Simple Cube
size = 20;
cube([size, size, size], center = true);`,

  sphere: `// Sphere with Resolution
radius = 15;
$fn = 64;
sphere(r = radius);`,

  cylinder: `// Cylinder
height = 30;
radius = 10;
$fn = 48;
cylinder(h = height, r = radius, center = true);`,

  box: `// Hollow Box
outer = 30;
wall = 2;

difference() {
    cube([outer, outer, outer], center = true);
    translate([0, 0, wall])
        cube([outer - 2*wall, outer - 2*wall, outer], center = true);
}`,

  gear: `// Simple Gear
teeth = 12;
radius = 20;
thickness = 5;

linear_extrude(height = thickness) {
    circle(r = radius * 0.8, $fn = teeth * 2);
    for (i = [0:teeth-1]) {
        rotate([0, 0, i * 360 / teeth])
            translate([radius * 0.8, 0])
                circle(r = radius * 0.15, $fn = 6);
    }
}`,
};

export function OpenSCADPreview({
  content,
  onChange,
  splitView = true
}: OpenSCADPreviewProps) {
  const [renderState, setRenderState] = useState<RenderState>({
    status: 'idle',
    errors: [],
    warnings: [],
  });
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [cameraRotation, setCameraRotation] = useState({ x: 55, y: 0, z: 25 });
  const [zoom, setZoom] = useState(100);
  const [outputFormat, setOutputFormat] = useState<'stl' | 'png' | '3mf'>('stl');
  const [autoRender, setAutoRender] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Extract parameters from code
  useEffect(() => {
    const paramRegex = /^(\w+)\s*=\s*([\d.]+|"[^"]*"|true|false)\s*;?\s*(?:\/\/.*)?$/gm;
    const extracted: Parameter[] = [];
    let match;

    while ((match = paramRegex.exec(content)) !== null) {
      const [, name, value] = match;
      let type: Parameter['type'] = 'number';
      let parsedValue: number | string | boolean;

      if (value === 'true' || value === 'false') {
        type = 'boolean';
        parsedValue = value === 'true';
      } else if (value.startsWith('"')) {
        type = 'string';
        parsedValue = value.slice(1, -1);
      } else {
        type = 'number';
        parsedValue = parseFloat(value);
      }

      extracted.push({ name, value: parsedValue, type });
    }

    setParameters(extracted);
  }, [content]);

  // Auto-render on content change
  useEffect(() => {
    if (autoRender && content) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        handleRender();
      }, 1000);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, autoRender]);

  const handleRender = useCallback(async () => {
    setRenderState(prev => ({ ...prev, status: 'rendering' }));

    try {
      const response = await fetch('/api/openscad/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: content,
          options: {
            outputFormat: 'png',
            camera: {
              rotate: [cameraRotation.x, cameraRotation.y, cameraRotation.z],
              distance: 140 * (100 / zoom),
            },
          },
        }),
      });

      const result = await response.json();

      setRenderState({
        status: result.success ? 'success' : 'error',
        previewImage: result.previewImage,
        errors: result.errors || [],
        warnings: result.warnings || [],
        renderTime: result.renderTime,
        geometryInfo: result.geometryInfo,
      });
    } catch (error) {
      setRenderState({
        status: 'error',
        errors: [(error as Error).message],
        warnings: [],
      });
    }
  }, [content, cameraRotation, zoom]);

  const handleParameterChange = useCallback((name: string, value: number | string | boolean) => {
    if (!onChange) return;

    // Update parameter in code
    const regex = new RegExp(`^(${name}\\s*=\\s*)([\\d.]+|"[^"]*"|true|false)`, 'm');
    const newValue = typeof value === 'string' ? `"${value}"` : String(value);
    const newContent = content.replace(regex, `$1${newValue}`);

    onChange(newContent);
  }, [content, onChange]);

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/openscad/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCode: content,
          options: { outputFormat },
        }),
      });

      const result = await response.json();

      if (result.success && result.outputPath) {
        // Trigger download
        const a = document.createElement('a');
        a.href = `/api/files/download?path=${encodeURIComponent(result.outputPath)}`;
        a.download = `model.${outputFormat}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [content, outputFormat]);

  const handleInsertTemplate = (templateKey: string) => {
    if (onChange && TEMPLATES[templateKey as keyof typeof TEMPLATES]) {
      onChange(TEMPLATES[templateKey as keyof typeof TEMPLATES]);
    }
  };

  const renderStatusIcon = () => {
    switch (renderState.status) {
      case 'rendering':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Box className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card">
        <Button
          variant="default"
          size="sm"
          onClick={handleRender}
          disabled={renderState.status === 'rendering'}
        >
          {renderState.status === 'rendering' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          Render
        </Button>

        <Select onValueChange={handleInsertTemplate}>
          <SelectTrigger className="w-28 h-8">
            <SelectValue placeholder="Templates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cube">Cube</SelectItem>
            <SelectItem value="sphere">Sphere</SelectItem>
            <SelectItem value="cylinder">Cylinder</SelectItem>
            <SelectItem value="box">Hollow Box</SelectItem>
            <SelectItem value="gear">Gear</SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(prev => Math.max(25, prev - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(prev => Math.min(200, prev + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCameraRotation({ x: 55, y: 0, z: 25 })}
          title="Reset Camera"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {renderStatusIcon()}
          {renderState.renderTime && (
            <span className="text-xs text-muted-foreground">
              {renderState.renderTime}ms
            </span>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as typeof outputFormat)}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stl">STL</SelectItem>
            <SelectItem value="3mf">3MF</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex ${splitView ? 'flex-row' : 'flex-col'} overflow-hidden`}>
        {/* Code Editor */}
        {splitView && (
          <div className="flex-1 flex flex-col border-r border-border">
            <textarea
              ref={editorRef}
              value={content}
              onChange={(e) => onChange?.(e.target.value)}
              className="flex-1 p-4 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
              placeholder="// Enter OpenSCAD code here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview & Parameters */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col">
            <TabsList className="mx-2 mt-2">
              <TabsTrigger value="preview" className="gap-1">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="params" className="gap-1">
                <Sliders className="h-4 w-4" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-1">
                <Settings className="h-4 w-4" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 m-0 p-0">
              <div className="h-full flex items-center justify-center bg-neutral-900 relative">
                {renderState.previewImage ? (
                  <img
                    src={renderState.previewImage}
                    alt="3D Preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Box className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Click "Render" to generate preview</p>
                    <p className="text-xs mt-1">or enable auto-render</p>
                  </div>
                )}

                {/* Camera controls overlay */}
                <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-8">X:</Label>
                    <Slider
                      value={[cameraRotation.x]}
                      onValueChange={([v]) => setCameraRotation(prev => ({ ...prev, x: v }))}
                      min={0}
                      max={360}
                      step={5}
                      className="w-24"
                    />
                    <span className="text-xs w-8">{cameraRotation.x}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-8">Y:</Label>
                    <Slider
                      value={[cameraRotation.y]}
                      onValueChange={([v]) => setCameraRotation(prev => ({ ...prev, y: v }))}
                      min={0}
                      max={360}
                      step={5}
                      className="w-24"
                    />
                    <span className="text-xs w-8">{cameraRotation.y}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-8">Z:</Label>
                    <Slider
                      value={[cameraRotation.z]}
                      onValueChange={([v]) => setCameraRotation(prev => ({ ...prev, z: v }))}
                      min={0}
                      max={360}
                      step={5}
                      className="w-24"
                    />
                    <span className="text-xs w-8">{cameraRotation.z}°</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="params" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {parameters.length > 0 ? (
                    parameters.map((param) => (
                      <div key={param.name} className="space-y-2">
                        <Label className="text-xs font-mono">{param.name}</Label>
                        {param.type === 'number' ? (
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[param.value as number]}
                              onValueChange={([v]) => handleParameterChange(param.name, v)}
                              min={param.min ?? 0}
                              max={param.max ?? (param.value as number) * 3}
                              step={param.step ?? 1}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={param.value as number}
                              onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                              className="w-20 h-8"
                            />
                          </div>
                        ) : param.type === 'boolean' ? (
                          <Select
                            value={String(param.value)}
                            onValueChange={(v) => handleParameterChange(param.name, v === 'true')}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={param.value as string}
                            onChange={(e) => handleParameterChange(param.name, e.target.value)}
                            className="h-8"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Sliders className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No parameters detected</p>
                      <p className="text-xs mt-1">
                        Define variables like: <code>size = 20;</code>
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="info" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Geometry Info */}
                  {renderState.geometryInfo && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Geometry</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {renderState.geometryInfo.vertices && (
                          <div className="bg-card p-2 rounded">
                            <span className="text-muted-foreground">Vertices:</span>
                            <span className="ml-2 font-mono">{renderState.geometryInfo.vertices}</span>
                          </div>
                        )}
                        {renderState.geometryInfo.facets && (
                          <div className="bg-card p-2 rounded">
                            <span className="text-muted-foreground">Facets:</span>
                            <span className="ml-2 font-mono">{renderState.geometryInfo.facets}</span>
                          </div>
                        )}
                        {renderState.geometryInfo.volume && (
                          <div className="bg-card p-2 rounded">
                            <span className="text-muted-foreground">Volume:</span>
                            <span className="ml-2 font-mono">{renderState.geometryInfo.volume.toFixed(2)} mm³</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {renderState.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-400">Errors</h4>
                      {renderState.errors.map((err, i) => (
                        <div key={i} className="text-xs bg-red-500/10 text-red-400 p-2 rounded font-mono">
                          {err}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {renderState.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-yellow-400">Warnings</h4>
                      {renderState.warnings.map((warn, i) => (
                        <div key={i} className="text-xs bg-yellow-500/10 text-yellow-400 p-2 rounded font-mono">
                          {warn}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Settings */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Settings</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoRender"
                        checked={autoRender}
                        onChange={(e) => setAutoRender(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="autoRender" className="text-xs">
                        Auto-render on change
                      </Label>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
