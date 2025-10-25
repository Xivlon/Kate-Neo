/**
 * Extensions Panel Component
 * 
 * UI for managing extensions - viewing, enabling, disabling, and configuring extensions.
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Package, Power, PowerOff, RefreshCw, Search, Settings } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Extensions</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadExtensions}
            className="bg-gray-800 hover:bg-gray-700 border-gray-600"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Extensions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading extensions...
            </div>
          ) : filteredExtensions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? 'No extensions found matching your search.' : 'No extensions installed.'}
              <div className="mt-4">
                <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-600">
                  Browse Marketplace
                </Button>
              </div>
            </div>
          ) : (
            filteredExtensions.map((extension) => (
              <Card key={extension.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        {extension.name}
                        <Badge
                          variant={
                            extension.state === 'active'
                              ? 'default'
                              : extension.state === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="ml-2"
                        >
                          {extension.state}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-sm">
                        {extension.publisher} • v{extension.version}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-gray-300">{extension.description}</p>
                  {extension.error && (
                    <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
                      Error: {extension.error}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  {extension.state === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(extension.id)}
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(extension.id)}
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          {extensions.length} extension{extensions.length !== 1 ? 's' : ''} installed
          {extensions.filter(e => e.state === 'active').length > 0 && (
            <span> • {extensions.filter(e => e.state === 'active').length} active</span>
          )}
        </div>
      </div>
    </div>
  );
}
