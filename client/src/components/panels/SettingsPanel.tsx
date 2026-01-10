/**
 * Settings Panel Component
 * 
 * Provides UI for managing Kate Neo IDE settings
 */

import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Globe, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { useI18n } from '../../hooks/useI18n';
import type { KateNeoSettings, SettingsScope } from '../../../../shared/settings-types';
import type { AIProvider } from '../../../../shared/ai-types';

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
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant Configuration</CardTitle>
                <CardDescription>Configure AI providers and models for code assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aiEnabled">Enable AI Assistant</Label>
                  <input
                    id="aiEnabled"
                    type="checkbox"
                    checked={settings.ai?.enabled === true}
                    onChange={(e) => saveSetting('ai.enabled', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="aiProvider">Active Provider</Label>
                  <Select
                    value={settings.ai?.activeProvider || 'openai'}
                    onValueChange={(v) => saveSetting('ai.activeProvider', v as AIProvider)}
                  >
                    <SelectTrigger id="aiProvider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="custom">Custom API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* OpenAI Settings */}
                {settings.ai?.activeProvider === 'openai' && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-sm">OpenAI Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="openaiApiKey">API Key</Label>
                        <Input
                          id="openaiApiKey"
                          type="password"
                          placeholder="sk-..."
                          value={settings.ai?.providers?.openai?.apiKey || ''}
                          onChange={(e) => saveSetting('ai.providers.openai.apiKey', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="openaiModel">Default Model</Label>
                        <Select
                          value={settings.ai?.providers?.openai?.defaultModel || 'gpt-3.5-turbo'}
                          onValueChange={(v) => saveSetting('ai.providers.openai.defaultModel', v)}
                        >
                          <SelectTrigger id="openaiModel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="openaiEnabled">Enable OpenAI</Label>
                        <input
                          id="openaiEnabled"
                          type="checkbox"
                          checked={settings.ai?.providers?.openai?.enabled !== false}
                          onChange={(e) => saveSetting('ai.providers.openai.enabled', e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Anthropic Settings */}
                {settings.ai?.activeProvider === 'anthropic' && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-sm">Anthropic Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="anthropicApiKey">API Key</Label>
                        <Input
                          id="anthropicApiKey"
                          type="password"
                          placeholder="sk-ant-..."
                          value={settings.ai?.providers?.anthropic?.apiKey || ''}
                          onChange={(e) => saveSetting('ai.providers.anthropic.apiKey', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="anthropicModel">Default Model</Label>
                        <Select
                          value={settings.ai?.providers?.anthropic?.defaultModel || 'claude-3-sonnet-20240229'}
                          onValueChange={(v) => saveSetting('ai.providers.anthropic.defaultModel', v)}
                        >
                          <SelectTrigger id="anthropicModel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                            <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="anthropicEnabled">Enable Anthropic</Label>
                        <input
                          id="anthropicEnabled"
                          type="checkbox"
                          checked={settings.ai?.providers?.anthropic?.enabled !== false}
                          onChange={(e) => saveSetting('ai.providers.anthropic.enabled', e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Custom API Settings */}
                {settings.ai?.activeProvider === 'custom' && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-sm">Custom API Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customApiKey">API Key (Optional)</Label>
                        <Input
                          id="customApiKey"
                          type="password"
                          placeholder="Your API key..."
                          value={settings.ai?.providers?.custom?.apiKey || ''}
                          onChange={(e) => saveSetting('ai.providers.custom.apiKey', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customBaseUrl">Base URL</Label>
                        <Input
                          id="customBaseUrl"
                          placeholder="https://api.example.com"
                          value={settings.ai?.providers?.custom?.customConfig?.baseUrl || ''}
                          onChange={(e) => saveSetting('ai.providers.custom.customConfig.baseUrl', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customEndpoint">Endpoint (Optional)</Label>
                        <Input
                          id="customEndpoint"
                          placeholder="/v1/chat/completions"
                          value={settings.ai?.providers?.custom?.customConfig?.endpoint || ''}
                          onChange={(e) => saveSetting('ai.providers.custom.customConfig.endpoint', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customFormat">API Format</Label>
                        <Select
                          value={settings.ai?.providers?.custom?.customConfig?.format || 'openai'}
                          onValueChange={(v) => saveSetting('ai.providers.custom.customConfig.format', v)}
                        >
                          <SelectTrigger id="customFormat">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI Compatible</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="customEnabled">Enable Custom API</Label>
                        <input
                          id="customEnabled"
                          type="checkbox"
                          checked={settings.ai?.providers?.custom?.enabled !== false}
                          onChange={(e) => saveSetting('ai.providers.custom.enabled', e.target.checked)}
                          className="h-4 w-4"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* General AI Settings */}
                <div className="grid gap-2">
                  <Label htmlFor="temperature">Temperature (0-2)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.ai?.temperature || 0.7}
                    onChange={(e) => saveSetting('ai.temperature', parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls randomness: 0 is deterministic, 2 is very creative
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
                    className="w-32"
                  />
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
