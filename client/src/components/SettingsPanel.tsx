/**
 * Settings Panel Component
 * 
 * Provides UI for managing Kate Neo IDE settings
 */

import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useI18n } from '../hooks/useI18n';
import type { KateNeoSettings, SettingsScope } from '../../shared/settings-types';

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editor">{t('settings.editor')}</TabsTrigger>
            <TabsTrigger value="terminal">{t('settings.terminal')}</TabsTrigger>
            <TabsTrigger value="git">{t('settings.git')}</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
