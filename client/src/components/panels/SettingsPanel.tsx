/**
 * Settings Panel Component
 *
 * Provides UI for managing Kate Neo IDE settings
 */

import { useState, useEffect } from 'react';
import { Settings, RotateCcw, Globe, Sparkles, ExternalLink, Check, Zap, Server } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useI18n } from '../../hooks/useI18n';
import type { KateNeoSettings, SettingsScope } from '../../../../shared/settings-types';
import {
  AIProvider,
  getAvailableProviders,
  getProviderTemplate,
  getProviderModels,
} from '../../../../shared/ai-types';

interface ProviderConfigCardProps {
  provider: AIProvider;
  settings: Partial<KateNeoSettings>;
  saveSetting: (key: string, value: unknown) => void;
}

function ProviderConfigCard({ provider, settings, saveSetting }: ProviderConfigCardProps) {
  const template = getProviderTemplate(provider);
  const models = getProviderModels(provider);
  const isOllama = provider === AIProvider.Ollama;
  const isCustom = provider === AIProvider.Custom;

  // Get model description with fallback
  const getModelDescription = () => {
    if (models.length === 0 || isCustom || isOllama) return null;
    const selectedModel = models.find(m => m.id === settings.ai?.providers?.[provider]?.defaultModel);
    const description = selectedModel?.description || models[0]?.description || '';
    return description || null;
  };

  const modelDescription = getModelDescription();

  return (
    <Card className="border-2 border-primary/30 bg-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{template.name} Configuration</CardTitle>
          {template.apiKeyLink && (
            <a
              href={template.apiKeyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Get API Key
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Key (not required for Ollama unless remote) */}
        <div className="grid gap-2">
          <Label htmlFor="providerApiKey">
            API Key {isOllama && '(Optional for local)'}
          </Label>
          <Input
            id="providerApiKey"
            type="password"
            placeholder={template.apiKeyPlaceholder || 'Enter your API key...'}
            value={settings.ai?.providers?.[provider]?.apiKey || ''}
            onChange={(e) => saveSetting(`ai.providers.${provider}.apiKey`, e.target.value)}
          />
        </div>

        {/* Custom Base URL for Ollama and Custom */}
        {(isOllama || isCustom) && (
          <div className="grid gap-2">
            <Label htmlFor="providerBaseUrl">Base URL</Label>
            <Input
              id="providerBaseUrl"
              placeholder={template.baseUrl || 'https://api.example.com'}
              value={settings.ai?.providers?.[provider]?.customConfig?.baseUrl || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.customConfig.baseUrl`, e.target.value)}
            />
            {isOllama && (
              <p className="text-xs text-muted-foreground">
                Default: http://localhost:11434 (local Ollama instance)
              </p>
            )}
          </div>
        )}

        {/* Custom Endpoint for Custom provider */}
        {isCustom && (
          <div className="grid gap-2">
            <Label htmlFor="providerEndpoint">API Endpoint</Label>
            <Input
              id="providerEndpoint"
              placeholder="/v1/chat/completions"
              value={settings.ai?.providers?.[provider]?.customConfig?.endpoint || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.customConfig.endpoint`, e.target.value)}
            />
          </div>
        )}

        {/* Model Selection */}
        <div className="grid gap-2">
          <Label htmlFor="providerModel">Default Model</Label>
          {isCustom || isOllama ? (
            <Input
              id="providerModel"
              placeholder={isOllama ? 'llama3, codellama, mistral...' : 'model-name'}
              value={settings.ai?.providers?.[provider]?.defaultModel || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.defaultModel`, e.target.value)}
            />
          ) : (
            <Select
              value={settings.ai?.providers?.[provider]?.defaultModel || models[0]?.id || ''}
              onValueChange={(v) => saveSetting(`ai.providers.${provider}.defaultModel`, v)}
            >
              <SelectTrigger id="providerModel">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      {model.contextWindow && (
                        <span className="text-xs text-muted-foreground">
                          {(model.contextWindow / 1000).toFixed(0)}K context
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {modelDescription && (
            <p className="text-xs text-muted-foreground">{modelDescription}</p>
          )}
        </div>

        {/* Enable Provider */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Label htmlFor="providerEnabled">Enable {template.name}</Label>
          <input
            id="providerEnabled"
            type="checkbox"
            checked={settings.ai?.providers?.[provider]?.enabled !== false}
            onChange={(e) => saveSetting(`ai.providers.${provider}.enabled`, e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPanel() {
  const { t, locale, locales, setLocale } = useI18n();
  const [settings, setSettings] = useState<Partial<KateNeoSettings>>({});
  const [scope, setScope] = useState<SettingsScope>('workspace' as SettingsScope);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [scope]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/settings?scope=${scope}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings || {});
        }
      }
    } catch (error) {
      console.error('[SettingsPanel] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, key, value }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local state
          setSettings((prev) => {
            const updated = { ...prev };
            const parts = key.split('.');
            
            // Prevent prototype pollution
            if (parts.some(p => p === '__proto__' || p === 'constructor' || p === 'prototype')) {
              console.error('[SettingsPanel] Invalid key:', key);
              return prev;
            }
            
            let current: any = updated;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) current[parts[i]] = {};
              current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('[SettingsPanel] Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm(t('settings.resetConfirm'))) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      if (res.ok) {
        await loadSettings();
      }
    } catch (error) {
      console.error('[SettingsPanel] Reset error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    const success = await setLocale(newLocale);
    if (!success) {
      console.error('[SettingsPanel] Failed to change locale');
    }
  };

  // Memoize provider data to avoid recalculating on every render
  const providers = useMemo(() => getAvailableProviders(), []);
  
  const providerData = useMemo(() => {
    return providers.map((provider) => ({
      provider,
      template: getProviderTemplate(provider),
      models: getProviderModels(provider),
      isActive: settings.ai?.activeProvider === provider,
      isConfigured: !!settings.ai?.providers?.[provider]?.apiKey,
    }));
  }, [providers, settings.ai?.activeProvider, settings.ai?.providers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{t('settings.title')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select value={scope} onValueChange={(v) => setScope(v as SettingsScope)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">{t('settings.global')}</SelectItem>
                <SelectItem value="workspace">{t('settings.workspace')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={resetSettings} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="editor">{t('settings.editor')}</TabsTrigger>
            <TabsTrigger value="terminal">{t('settings.terminal')}</TabsTrigger>
            <TabsTrigger value="git">{t('settings.git')}</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-1" />
              AI
            </TabsTrigger>
            <TabsTrigger value="appearance">{t('settings.appearance')}</TabsTrigger>
            <TabsTrigger value="extensions">{t('settings.extensions')}</TabsTrigger>
          </TabsList>

          {/* Editor Settings */}
          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.editor')}</CardTitle>
                <CardDescription>Configure editor behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fontSize">{t('settings.fontSize')}</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={settings.editor?.fontSize || 14}
                    onChange={(e) => saveSetting('editor.fontSize', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fontFamily">{t('settings.fontFamily')}</Label>
                  <Input
                    id="fontFamily"
                    value={settings.editor?.fontFamily || 'monospace'}
                    onChange={(e) => saveSetting('editor.fontFamily', e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tabSize">{t('settings.tabSize')}</Label>
                  <Input
                    id="tabSize"
                    type="number"
                    value={settings.editor?.tabSize || 4}
                    onChange={(e) => saveSetting('editor.tabSize', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lineNumbers">{t('settings.lineNumbers')}</Label>
                  <Select
                    value={settings.editor?.lineNumbers || 'on'}
                    onValueChange={(v) => saveSetting('editor.lineNumbers', v)}
                  >
                    <SelectTrigger id="lineNumbers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="interval">Interval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="wordWrap">{t('settings.wordWrap')}</Label>
                  <Select
                    value={settings.editor?.wordWrap || 'off'}
                    onValueChange={(v) => saveSetting('editor.wordWrap', v)}
                  >
                    <SelectTrigger id="wordWrap">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="wordWrapColumn">Word Wrap Column</SelectItem>
                      <SelectItem value="bounded">Bounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Terminal Settings */}
          <TabsContent value="terminal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.terminal')}</CardTitle>
                <CardDescription>Configure terminal behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="terminalFontSize">{t('settings.fontSize')}</Label>
                  <Input
                    id="terminalFontSize"
                    type="number"
                    value={settings.terminal?.fontSize || 14}
                    onChange={(e) => saveSetting('terminal.fontSize', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="terminalFontFamily">{t('settings.fontFamily')}</Label>
                  <Input
                    id="terminalFontFamily"
                    value={settings.terminal?.fontFamily || 'monospace'}
                    onChange={(e) => saveSetting('terminal.fontFamily', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Git Settings */}
          <TabsContent value="git" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.git')}</CardTitle>
                <CardDescription>Configure Git integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gitEnabled">Enable Git Integration</Label>
                  <input
                    id="gitEnabled"
                    type="checkbox"
                    checked={settings.git?.enabled !== false}
                    onChange={(e) => saveSetting('git.enabled', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autoFetch">Auto Fetch</Label>
                  <input
                    id="autoFetch"
                    type="checkbox"
                    checked={settings.git?.autoFetch === true}
                    onChange={(e) => saveSetting('git.autoFetch', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearance')}</CardTitle>
                <CardDescription>Configure IDE appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="language">
                    <Globe className="h-4 w-4 inline mr-2" />
                    {t('settings.language')}
                  </Label>
                  <Select value={locale} onValueChange={handleLocaleChange}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locales.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extensions Settings */}
          <TabsContent value="extensions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.extensions')}</CardTitle>
                <CardDescription>Configure extension behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoUpdate">Auto Update Extensions</Label>
                  <input
                    id="autoUpdate"
                    type="checkbox"
                    checked={settings.extensions?.autoUpdate === true}
                    onChange={(e) => saveSetting('extensions.autoUpdate', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showRecommendations">Show Recommendations</Label>
                  <input
                    id="showRecommendations"
                    type="checkbox"
                    checked={settings.extensions?.showRecommendations !== false}
                    onChange={(e) => saveSetting('extensions.showRecommendations', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-4">
            {/* Enable/Disable AI */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription>Enable AI-powered code assistance</CardDescription>
                  </div>
                  <input
                    id="aiEnabled"
                    type="checkbox"
                    checked={settings.ai?.enabled === true}
                    onChange={(e) => saveSetting('ai.enabled', e.target.checked)}
                    className="h-5 w-5"
                    aria-label="AI Assistant"
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Quick Connect - Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Connect
                </CardTitle>
                <CardDescription>
                  Select a provider and enter your API key to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(() => {
                    const providers = getAvailableProviders();
                    return providers.map((provider) => {
                      const template = getProviderTemplate(provider);
                      const isActive = settings.ai?.activeProvider === provider;
                      const isConfigured = !!settings.ai?.providers?.[provider]?.apiKey;

                      return (
                        <button
                          key={provider}
                          onClick={() => saveSetting('ai.activeProvider', provider)}
                          className={`
                            relative p-3 rounded-lg border-2 text-left transition-all
                            hover:border-primary/50 hover:bg-accent/50
                            ${isActive ? 'border-primary bg-accent' : 'border-border'}
                          `}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{template.name}</span>
                            {isConfigured && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          {template.openaiCompatible && provider !== AIProvider.OpenAI && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              OpenAI Compatible
                            </Badge>
                          )}
                          {provider === AIProvider.Ollama && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              <Server className="h-3 w-3 mr-1" />
                              Local
                            </Badge>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Active Provider Configuration */}
                {settings.ai?.activeProvider && (
                  <ProviderConfigCard
                    provider={settings.ai.activeProvider}
                    settings={settings}
                    saveSetting={saveSetting}
                  />
                )}
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Fine-tune AI behavior for your workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.ai?.temperature || 0.7}
                      onChange={(e) => saveSetting('ai.temperature', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = deterministic, 2 = creative
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxResponseTokens">Max Response Tokens</Label>
                    <Input
                      id="maxResponseTokens"
                      type="number"
                      min="100"
                      max="32000"
                      step="100"
                      value={settings.ai?.maxResponseTokens || 2000}
                      onChange={(e) => saveSetting('ai.maxResponseTokens', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder="You are a helpful AI coding assistant..."
                    value={settings.ai?.systemPrompt || ''}
                    onChange={(e) => saveSetting('ai.systemPrompt', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Customize how the AI assistant behaves and responds
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extensions Settings */}
          <TabsContent value="extensions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.extensions')}</CardTitle>
                <CardDescription>Configure extension behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoUpdate">Auto Update Extensions</Label>
                  <input
                    id="autoUpdate"
                    type="checkbox"
                    checked={settings.extensions?.autoUpdate === true}
                    onChange={(e) => saveSetting('extensions.autoUpdate', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showRecommendations">Show Recommendations</Label>
                  <input
                    id="showRecommendations"
                    type="checkbox"
                    checked={settings.extensions?.showRecommendations !== false}
                    onChange={(e) => saveSetting('extensions.showRecommendations', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
