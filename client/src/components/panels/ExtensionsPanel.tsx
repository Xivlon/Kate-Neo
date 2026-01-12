/**
 * Extensions Panel Component
 *
 * UI for managing extensions - viewing, enabling, disabling, and configuring extensions.
 * Uses SpaceFill for automatic whitespace management.
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Package, Power, PowerOff, RefreshCw, Search, Settings } from 'lucide-react';
import { PanelFill, ToolbarFill, ListFill, CardFill } from '../common/SpaceFill';

interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  publisher: string;
  state: 'unloaded' | 'loading' | 'active' | 'failed' | 'disabled';
  error?: string;
  activatedAt?: number;
}

export function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/extensions');
      const data = await response.json();
      setExtensions(data.extensions || []);
    } catch (error) {
      console.error('Failed to load extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (extensionId: string) => {
    try {
      await fetch(`/api/extensions/${extensionId}/activate`, { method: 'POST' });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to activate extension:', error);
    }
  };

  const handleDeactivate = async (extensionId: string) => {
    try {
      await fetch(`/api/extensions/${extensionId}/deactivate`, { method: 'POST' });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to deactivate extension:', error);
    }
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PanelFill className="bg-card text-card-foreground" padding="p-0">
      {/* Header - uses ToolbarFill for automatic spacing */}
      <ToolbarFill className="border-b border-card-border flex-shrink-0" justify="between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Extensions</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadExtensions}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </ToolbarFill>

      {/* Search - uses ToolbarFill */}
      <ToolbarFill className="border-b border-card-border flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </ToolbarFill>

      {/* Extensions List - uses ListFill for scrollable content with auto spacing */}
      <ListFill className="flex-1">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading extensions...
          </div>
        ) : filteredExtensions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No extensions found matching your search.' : 'No extensions installed.'}
            <div className="mt-4">
              <Button variant="outline">
                Browse Marketplace
              </Button>
            </div>
          </div>
        ) : (
          filteredExtensions.map((extension) => (
            <CardFill key={extension.id} as="article" className="bg-muted/50 border border-border rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium flex items-center gap-2 flex-wrap">
                    <span className="truncate">{extension.name}</span>
                    <Badge
                      variant={
                        extension.state === 'active'
                          ? 'default'
                          : extension.state === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {extension.state}
                    </Badge>
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {extension.publisher} • v{extension.version}
                  </p>
                </div>
              </div>
              <p className="text-sm">{extension.description}</p>
              {extension.error && (
                <div className="p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                  Error: {extension.error}
                </div>
              )}
              <ToolbarFill padding="p-0" className="mt-auto">
                {extension.state === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeactivate(extension.id)}
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActivate(extension.id)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </ToolbarFill>
            </CardFill>
          ))
        )}
      </ListFill>

      {/* Footer - uses ToolbarFill */}
      <ToolbarFill className="border-t border-card-border flex-shrink-0" justify="center">
        <span className="text-xs text-muted-foreground">
          {extensions.length} extension{extensions.length !== 1 ? 's' : ''} installed
          {extensions.filter(e => e.state === 'active').length > 0 && (
            <span> • {extensions.filter(e => e.state === 'active').length} active</span>
          )}
        </span>
      </ToolbarFill>
    </PanelFill>
  );
}
