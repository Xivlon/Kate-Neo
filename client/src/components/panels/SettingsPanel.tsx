/**
 * Settings Panel Component
 *
 * Provides UI for managing Kate Neo IDE settings
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Settings, RotateCcw, Globe, Sparkles, ExternalLink, Check, Zap, Server, Maximize2, Monitor, PanelLeft, Save, Undo2, AlertCircle, LayoutGrid, Rows } from 'lucide-react';
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
      <CardHeader className="p-3 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">{template.name} Config</CardTitle>
          {template.apiKeyLink && (
            <a
              href={template.apiKeyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Get Key
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2.5">
        {/* API Key (not required for Ollama unless remote) */}
        <div className="grid gap-1">
          <Label htmlFor="providerApiKey" className="text-xs">
            API Key {isOllama && '(Optional)'}
          </Label>
          <Input
            id="providerApiKey"
            type="password"
            placeholder={template.apiKeyPlaceholder || 'Enter API key...'}
            value={settings.ai?.providers?.[provider]?.apiKey || ''}
            onChange={(e) => saveSetting(`ai.providers.${provider}.apiKey`, e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Custom Base URL for Ollama and Custom */}
        {(isOllama || isCustom) && (
          <div className="grid gap-1">
            <Label htmlFor="providerBaseUrl" className="text-xs">Base URL</Label>
            <Input
              id="providerBaseUrl"
              placeholder={template.baseUrl || 'https://api.example.com'}
              value={settings.ai?.providers?.[provider]?.customConfig?.baseUrl || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.customConfig.baseUrl`, e.target.value)}
              className="h-8 text-sm"
            />
            {isOllama && (
              <p className="text-[10px] text-muted-foreground">
                Default: http://localhost:11434
              </p>
            )}
          </div>
        )}

        {/* Custom Endpoint for Custom provider */}
        {isCustom && (
          <div className="grid gap-1">
            <Label htmlFor="providerEndpoint" className="text-xs">API Endpoint</Label>
            <Input
              id="providerEndpoint"
              placeholder="/v1/chat/completions"
              value={settings.ai?.providers?.[provider]?.customConfig?.endpoint || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.customConfig.endpoint`, e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Model Selection */}
        <div className="grid gap-1">
          <Label htmlFor="providerModel" className="text-xs">Default Model</Label>
          {isCustom || isOllama ? (
            <Input
              id="providerModel"
              placeholder={isOllama ? 'llama3, codellama...' : 'model-name'}
              value={settings.ai?.providers?.[provider]?.defaultModel || ''}
              onChange={(e) => saveSetting(`ai.providers.${provider}.defaultModel`, e.target.value)}
              className="h-8 text-sm"
            />
          ) : (
            <Select
              value={settings.ai?.providers?.[provider]?.defaultModel || models[0]?.id || ''}
              onValueChange={(v) => saveSetting(`ai.providers.${provider}.defaultModel`, v)}
            >
              <SelectTrigger id="providerModel" className="h-8 text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="text-sm">{model.name}</span>
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
            <p className="text-[10px] text-muted-foreground line-clamp-2">{modelDescription}</p>
          )}
        </div>

        {/* Enable Provider */}
        <div className="flex items-center justify-between pt-2 border-t gap-2">
          <Label htmlFor="providerEnabled" className="text-xs">Enable {template.name}</Label>
          <input
            id="providerEnabled"
            type="checkbox"
            checked={settings.ai?.providers?.[provider]?.enabled !== false}
            onChange={(e) => saveSetting(`ai.providers.${provider}.enabled`, e.target.checked)}
            className="h-4 w-4 flex-shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPanel() {
  const { t, locale, locales, setLocale } = useI18n();
  const [settings, setSettings] = useState<Partial<KateNeoSettings>>({});
  const [pendingChanges, setPendingChanges] = useState<Map<string, unknown>>(new Map());
  const [scope, setScope] = useState<SettingsScope>('workspace' as SettingsScope);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applySuccess, setApplySuccess] = useState<boolean | null>(null);
  const originalSettings = useRef<Partial<KateNeoSettings>>({});

  // Track if there are unsaved changes
  const hasChanges = pendingChanges.size > 0;

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
          originalSettings.current = data.settings || {};
          setPendingChanges(new Map()); // Clear pending changes on load
        }
      }
    } catch (error) {
      console.error('[SettingsPanel] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update local setting state without saving to server
  const updateSetting = useCallback((key: string, value: unknown) => {
    // Prevent prototype pollution
    const parts = key.split('.');
    if (parts.some(p => p === '__proto__' || p === 'constructor' || p === 'prototype')) {
      console.error('[SettingsPanel] Invalid key:', key);
      return;
    }

    // Track the change
    setPendingChanges(prev => {
      const updated = new Map(prev);
      updated.set(key, value);
      return updated;
    });

    // Update local state for immediate UI feedback
    setSettings((prev) => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return updated;
    });

    // Clear success indicator when new changes are made
    setApplySuccess(null);
  }, []);

  // Apply all pending changes to the server
  const applySettings = useCallback(async () => {
    if (pendingChanges.size === 0) return;

    try {
      setSaving(true);
      setApplySuccess(null);

      // Save all pending changes
      const savePromises = Array.from(pendingChanges.entries()).map(([key, value]) =>
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scope, key, value }),
        })
      );

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        // Update original settings reference
        originalSettings.current = { ...settings };
        setPendingChanges(new Map());
        setApplySuccess(true);

        // Clear success indicator after 3 seconds
        setTimeout(() => setApplySuccess(null), 3000);
      } else {
        setApplySuccess(false);
        console.error('[SettingsPanel] Some settings failed to save');
      }
    } catch (error) {
      console.error('[SettingsPanel] Apply error:', error);
      setApplySuccess(false);
    } finally {
      setSaving(false);
    }
  }, [pendingChanges, scope, settings]);

  // Discard pending changes and revert to original settings
  const discardChanges = useCallback(() => {
    setSettings({ ...originalSettings.current });
    setPendingChanges(new Map());
    setApplySuccess(null);
  }, []);

  // Legacy function for backwards compatibility (used by locale change which should apply immediately)
  const saveSetting = async (key: string, value: unknown) => {
    updateSetting(key, value);
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
    return providers.map((provider: AIProvider) => ({
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
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b px-4 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-lg font-semibold truncate">{t('settings.title')}</h2>
            {hasChanges && (
              <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded flex-shrink-0">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
            {applySuccess === true && (
              <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded flex-shrink-0">
                <Check className="h-3 w-3" />
                Settings applied
              </span>
            )}
            {applySuccess === false && (
              <span className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded flex-shrink-0">
                <AlertCircle className="h-3 w-3" />
                Failed to apply
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Select value={scope} onValueChange={(v) => setScope(v as SettingsScope)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">{t('settings.global')}</SelectItem>
                <SelectItem value="workspace">{t('settings.workspace')}</SelectItem>
              </SelectContent>
            </Select>
            {hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={saving}
                  className="text-muted-foreground"
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applySettings}
                  disabled={saving}
                  className="bg-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Applying...' : 'Apply'}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={resetSettings} disabled={saving || hasChanges}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <Tabs defaultValue="editor" className="w-full">
          <div className="overflow-x-auto -mx-1 px-1 pb-2">
            <TabsList className="inline-flex w-max min-w-full">
              <TabsTrigger value="editor" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">{t('settings.editor')}</TabsTrigger>
              <TabsTrigger value="terminal" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">{t('settings.terminal')}</TabsTrigger>
              <TabsTrigger value="git" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">{t('settings.git')}</TabsTrigger>
              <TabsTrigger value="ai" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">
                <Sparkles className="h-4 w-4 mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">{t('settings.appearance')}</TabsTrigger>
              <TabsTrigger value="extensions" className="flex-1 min-w-0 px-2 text-xs sm:text-sm sm:px-3">{t('settings.extensions')}</TabsTrigger>
            </TabsList>
          </div>

          {/* Editor Settings */}
          <TabsContent value="editor" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{t('settings.editor')}</CardTitle>
                <CardDescription className="text-xs">Configure editor behavior and appearance</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="fontSize" className="text-sm">{t('settings.fontSize')}</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={settings.editor?.fontSize || 14}
                    onChange={(e) => saveSetting('editor.fontSize', parseInt(e.target.value))}
                    className="w-24 h-8 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="fontFamily" className="text-sm">{t('settings.fontFamily')}</Label>
                  <Input
                    id="fontFamily"
                    value={settings.editor?.fontFamily || 'monospace'}
                    onChange={(e) => saveSetting('editor.fontFamily', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="tabSize" className="text-sm">{t('settings.tabSize')}</Label>
                  <Input
                    id="tabSize"
                    type="number"
                    value={settings.editor?.tabSize || 4}
                    onChange={(e) => saveSetting('editor.tabSize', parseInt(e.target.value))}
                    className="w-24 h-8 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="lineNumbers" className="text-sm">{t('settings.lineNumbers')}</Label>
                  <Select
                    value={settings.editor?.lineNumbers || 'on'}
                    onValueChange={(v) => saveSetting('editor.lineNumbers', v)}
                  >
                    <SelectTrigger id="lineNumbers" className="h-8 text-sm">
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

                <div className="grid gap-1.5">
                  <Label htmlFor="wordWrap" className="text-sm">{t('settings.wordWrap')}</Label>
                  <Select
                    value={settings.editor?.wordWrap || 'off'}
                    onValueChange={(v) => saveSetting('editor.wordWrap', v)}
                  >
                    <SelectTrigger id="wordWrap" className="h-8 text-sm">
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
          <TabsContent value="terminal" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{t('settings.terminal')}</CardTitle>
                <CardDescription className="text-xs">Configure terminal behavior</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="terminalFontSize" className="text-sm">{t('settings.fontSize')}</Label>
                  <Input
                    id="terminalFontSize"
                    type="number"
                    value={settings.terminal?.fontSize || 14}
                    onChange={(e) => saveSetting('terminal.fontSize', parseInt(e.target.value))}
                    className="w-24 h-8 text-sm"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="terminalFontFamily" className="text-sm">{t('settings.fontFamily')}</Label>
                  <Input
                    id="terminalFontFamily"
                    value={settings.terminal?.fontFamily || 'monospace'}
                    onChange={(e) => saveSetting('terminal.fontFamily', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Git Settings */}
          <TabsContent value="git" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{t('settings.git')}</CardTitle>
                <CardDescription className="text-xs">Configure Git integration</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="gitEnabled" className="text-sm">Enable Git Integration</Label>
                  <input
                    id="gitEnabled"
                    type="checkbox"
                    checked={settings.git?.enabled !== false}
                    onChange={(e) => saveSetting('git.enabled', e.target.checked)}
                    className="h-4 w-4 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="autoFetch" className="text-sm">Auto Fetch</Label>
                  <input
                    id="autoFetch"
                    type="checkbox"
                    checked={settings.git?.autoFetch === true}
                    onChange={(e) => saveSetting('git.autoFetch', e.target.checked)}
                    className="h-4 w-4 flex-shrink-0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-3">
            {/* Dynamic Adaptation */}
            <Card>
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Maximize2 className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Dynamic Adaptation</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Auto-adjust spacing and layouts based on available space
                    </CardDescription>
                  </div>
                  <input
                    id="dynamicAdaptation"
                    type="checkbox"
                    checked={settings.appearance?.dynamicAdaptation !== false}
                    onChange={(e) => saveSetting('appearance.dynamicAdaptation', e.target.checked)}
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    aria-label="Dynamic Adaptation"
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Theme & Layout */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4 flex-shrink-0" />
                  Theme & Layout
                </CardTitle>
                <CardDescription className="text-xs">Configure IDE appearance</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="theme" className="text-sm">Theme</Label>
                  <Select
                    value={settings.appearance?.theme || 'dark'}
                    onValueChange={(v) => saveSetting('appearance.theme', v)}
                  >
                    <SelectTrigger id="theme" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="sidebarPosition" className="text-sm flex items-center">
                    <PanelLeft className="h-3.5 w-3.5 mr-1.5" />
                    Sidebar Position
                  </Label>
                  <Select
                    value={settings.appearance?.sidebarPosition || 'left'}
                    onValueChange={(v) => saveSetting('appearance.sidebarPosition', v)}
                  >
                    <SelectTrigger id="sidebarPosition" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="activityBarPosition" className="text-sm">Activity Bar Position</Label>
                  <Select
                    value={settings.appearance?.activityBarPosition || 'left'}
                    onValueChange={(v) => saveSetting('appearance.activityBarPosition', v)}
                  >
                    <SelectTrigger id="activityBarPosition" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="layoutMode" className="text-sm flex items-center">
                    {settings.appearance?.layoutMode === 'grid' ? (
                      <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Rows className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Layout Mode
                  </Label>
                  <Select
                    value={settings.appearance?.layoutMode || 'flex'}
                    onValueChange={(v) => saveSetting('appearance.layoutMode', v)}
                  >
                    <SelectTrigger id="layoutMode" className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flex">
                        <div className="flex items-center gap-2">
                          <Rows className="h-4 w-4" />
                          <span>Flex Layout</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="grid">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-4 w-4" />
                          <span>Grid Layout (4x4)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {settings.appearance?.layoutMode === 'grid'
                      ? 'Crystal Reflow grid with elastic pane expansion'
                      : 'Traditional flexible panel layout'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  {t('settings.language')}
                </CardTitle>
                <CardDescription className="text-xs">Select your preferred language</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Select value={locale} onValueChange={handleLocaleChange}>
                  <SelectTrigger id="language" className="h-8 text-sm">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extensions Settings */}
          <TabsContent value="extensions" className="space-y-3">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{t('settings.extensions')}</CardTitle>
                <CardDescription className="text-xs">Configure extension behavior</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="autoUpdate" className="text-sm">Auto Update Extensions</Label>
                  <input
                    id="autoUpdate"
                    type="checkbox"
                    checked={settings.extensions?.autoUpdate === true}
                    onChange={(e) => saveSetting('extensions.autoUpdate', e.target.checked)}
                    className="h-4 w-4 flex-shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="showRecommendations" className="text-sm">Show Recommendations</Label>
                  <input
                    id="showRecommendations"
                    type="checkbox"
                    checked={settings.extensions?.showRecommendations !== false}
                    onChange={(e) => saveSetting('extensions.showRecommendations', e.target.checked)}
                    className="h-4 w-4 flex-shrink-0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-3">
            {/* Enable/Disable AI */}
            <Card>
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 flex-shrink-0" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Enable AI-powered code assistance</CardDescription>
                  </div>
                  <input
                    id="aiEnabled"
                    type="checkbox"
                    checked={settings.ai?.enabled === true}
                    onChange={(e) => saveSetting('ai.enabled', e.target.checked)}
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    aria-label="AI Assistant"
                  />
                </div>
              </CardHeader>
            </Card>

            {/* Quick Connect - Provider Selection */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 flex-shrink-0" />
                  Quick Connect
                </CardTitle>
                <CardDescription className="text-xs">
                  Select a provider and enter your API key
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {/* Provider Grid - single column on narrow, 2 cols on wider */}
                <div className="grid grid-cols-1 gap-2">
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
                            relative p-2.5 rounded-lg border-2 text-left transition-all
                            hover:border-primary/50 hover:bg-accent/50
                            ${isActive ? 'border-primary bg-accent' : 'border-border'}
                          `}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{template.name}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {template.openaiCompatible && provider !== AIProvider.OpenAI && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  OpenAI
                                </Badge>
                              )}
                              {provider === AIProvider.Ollama && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  <Server className="h-2.5 w-2.5 mr-0.5" />
                                  Local
                                </Badge>
                              )}
                              {isConfigured && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </div>
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
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">Advanced Settings</CardTitle>
                <CardDescription className="text-xs">Fine-tune AI behavior</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="temperature" className="text-sm">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.ai?.temperature || 0.7}
                      onChange={(e) => saveSetting('ai.temperature', parseFloat(e.target.value))}
                      className="h-8 text-sm w-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = deterministic, 2 = creative
                    </p>
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="maxResponseTokens" className="text-sm">Max Response Tokens</Label>
                    <Input
                      id="maxResponseTokens"
                      type="number"
                      min="100"
                      max="32000"
                      step="100"
                      value={settings.ai?.maxResponseTokens || 2000}
                      onChange={(e) => saveSetting('ai.maxResponseTokens', parseInt(e.target.value))}
                      className="h-8 text-sm w-28"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="systemPrompt" className="text-sm">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder="You are a helpful AI coding assistant..."
                    value={settings.ai?.systemPrompt || ''}
                    onChange={(e) => saveSetting('ai.systemPrompt', e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customize AI behavior and responses
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
