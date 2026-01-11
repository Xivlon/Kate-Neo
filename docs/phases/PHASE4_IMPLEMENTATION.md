# Phase 4: Production Ready - Implementation Guide

This document describes the implementation of Phase 4 features for Kate Neo IDE, including Settings & Configuration and Internationalization (i18n) systems.

## Overview

Phase 4 adds production-ready features to make Kate Neo IDE configurable and accessible to international users:

1. **Settings & Configuration** - Comprehensive settings management with multi-scope support
2. **Internationalization (i18n)** - Multi-language support with translation management

## Settings & Configuration System

### Architecture

The settings system provides hierarchical configuration with three scopes:

- **Global** - Settings that apply to all workspaces (stored in `~/.kate-neo/settings.json`)
- **Workspace** - Settings specific to the current workspace (stored in `.kate-neo/settings.json`)
- **Folder** - Settings for specific folders within a workspace (future enhancement)

Settings are merged with the following precedence: Folder > Workspace > Global > Default

### Backend Components

#### Settings Manager Service

Location: `server/settings-manager.ts`

**Features:**
- Hierarchical settings management with scope precedence
- Dot-notation key access (e.g., 'editor.fontSize')
- Auto-save to JSON files
- Deep merging of settings from different scopes
- Settings change events via EventEmitter
- Singleton pattern for global access

**Configuration:**
```typescript
const settingsManager = new SettingsManager({
  globalSettingsDir: '~/.kate-neo',      // Global settings location
  workspaceDir: '/path/to/workspace',    // Current workspace
  autoSave: true,                        // Auto-save on changes
});
```

**Key Methods:**
- `initialize()` - Load settings from disk
- `getSettings(request)` - Get settings with optional scope and key filtering
- `updateSetting(request)` - Update a specific setting
- `deleteSetting(scope, key)` - Delete a setting (revert to default)
- `resetSettings(scope)` - Reset all settings in a scope to defaults
- `getAllSettings()` - Get merged settings from all scopes

#### Settings Types

Location: `shared/settings-types.ts`

**Defines:**
- `SettingsScope` enum (Global, Workspace, Folder)
- `KateNeoSettings` interface - Complete settings structure
- `EditorSettings` - Editor configuration
- `TerminalSettings` - Terminal configuration
- `GitSettings` - Git integration settings
- `DebugSettings` - Debug configuration
- `ExtensionSettings` - Extension behavior
- `LanguageSettings` - Language-specific configurations
- `DEFAULT_SETTINGS` - Default values for all settings

**Example Settings Structure:**
```typescript
{
  editor: {
    fontSize: 14,
    fontFamily: "Fira Code",
    lineNumbers: "on",
    tabSize: 4,
    insertSpaces: true,
    wordWrap: "off",
    minimap: {
      enabled: true,
      maxColumn: 120
    }
  },
  terminal: {
    fontSize: 14,
    fontFamily: "monospace",
    cursorStyle: "block"
  },
  git: {
    enabled: true,
    autoFetch: false
  }
}
```

### API Endpoints

#### Get Settings
```http
GET /api/settings?scope=<scope>&key=<key>
```

Query parameters:
- `scope` (optional): 'global' or 'workspace'
- `key` (optional): Dot-notation key (e.g., 'editor.fontSize')

Response:
```json
{
  "success": true,
  "settings": { ... }
}
```

#### Update Setting
```http
PUT /api/settings
```

Request body:
```json
{
  "scope": "workspace",
  "key": "editor.fontSize",
  "value": 16
}
```

#### Delete Setting
```http
DELETE /api/settings
```

Request body:
```json
{
  "scope": "workspace",
  "key": "editor.fontSize"
}
```

#### Reset Settings
```http
POST /api/settings/reset
```

Request body:
```json
{
  "scope": "workspace"
}
```

### Frontend Components

#### Settings Panel

Location: `client/src/components/SettingsPanel.tsx`

**Features:**
- Tabbed interface for different setting categories
- Scope selector (Global/Workspace)
- Real-time setting updates
- Reset to defaults functionality
- Language selector integrated

**Setting Categories:**
1. **Editor** - Font size, font family, tab size, line numbers, word wrap
2. **Terminal** - Font size, font family
3. **Git** - Enable/disable, auto fetch
4. **Appearance** - Language selection
5. **Extensions** - Auto update, show recommendations

**Usage:**
```tsx
import { SettingsPanel } from '@/components/SettingsPanel';

<SettingsPanel />
```

### Settings Persistence

Settings are stored as JSON files:

**Global Settings:**
- Location: `~/.kate-neo/settings.json`
- Applies to all workspaces

**Workspace Settings:**
- Location: `<workspace>/.kate-neo/settings.json`
- Applies to current workspace only

### Security

**Protection Against:**
- **Prototype Pollution:** All key parts are validated to reject '__proto__', 'constructor', and 'prototype'
- **Path Injection:** Settings paths are validated to ensure they're within allowed directories

## Internationalization (i18n) System

### Architecture

The i18n system provides multi-language support with:

- Translation file management
- Locale switching
- Parameter interpolation
- Fallback mechanism

### Backend Components

#### I18n Service

Location: `server/i18n-service.ts`

**Features:**
- Multi-locale support
- Translation file loading and caching
- Parameter interpolation in translations
- Fallback locale support
- Locale change events via EventEmitter
- Singleton pattern for global access

**Configuration:**
```typescript
const i18nService = new I18nService({
  localesDir: './locales',           // Translation files location
  defaultLocale: 'en',               // Default locale
  fallbackLocale: 'en',              // Fallback when translation not found
});
```

**Key Methods:**
- `initialize()` - Load all translation files
- `translate(request)` - Translate a key with optional parameters
- `t(key, params)` - Convenience method for translation
- `getCurrentLocale()` - Get current locale
- `setLocale(locale)` - Change current locale
- `getAvailableLocales()` - List all available locales
- `getAllTranslations()` - Get all translations for current locale

#### I18n Types

Location: `shared/i18n-types.ts`

**Defines:**
- `SupportedLocale` enum (en, es, fr, de, zh, ja)
- `TranslationDictionary` - Nested translation structure
- `TranslationRequest` - Request with key and parameters
- `TranslationResponse` - Response with translated text
- `LocaleChangeEvent` - Locale change notification

### Translation Files

Location: `locales/`

**Structure:**
```
locales/
├── en.json     # English (base)
├── es.json     # Spanish
└── ...         # Additional languages
```

**Translation File Format:**
```json
{
  "app": {
    "name": "Kate Neo",
    "tagline": "Modern IDE with Powerful Editing"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "editor": {
    "saveFile": "Save File",
    "openFile": "Open File"
  },
  "messages": {
    "fileSaved": "File saved: {{name}}"
  }
}
```

**Parameter Interpolation:**
Use `{{paramName}}` in translations:
```
"fileSaved": "File saved: {{name}}"
```

### API Endpoints

#### Get Available Locales
```http
GET /api/i18n/locales
```

Response:
```json
{
  "locales": ["en", "es"],
  "current": "en"
}
```

#### Get Current Locale
```http
GET /api/i18n/locale
```

Response:
```json
{
  "locale": "en"
}
```

#### Set Locale
```http
POST /api/i18n/locale
```

Request body:
```json
{
  "locale": "es"
}
```

#### Translate Key
```http
POST /api/i18n/translate
```

Request body:
```json
{
  "key": "messages.fileSaved",
  "params": { "name": "example.txt" }
}
```

Response:
```json
{
  "success": true,
  "text": "File saved: example.txt"
}
```

#### Get All Translations
```http
GET /api/i18n/translations?locale=<locale>
```

### Frontend Components

#### useI18n Hook

Location: `client/src/hooks/useI18n.tsx`

**Features:**
- React hook for easy i18n integration
- Locale state management
- Translation function with interpolation
- Locale switching

**Usage:**
```tsx
import { useI18n } from '@/hooks/useI18n';

function MyComponent() {
  const { t, locale, setLocale, locales } = useI18n();
  
  return (
    <div>
      <p>{t('app.name')}</p>
      <p>{t('messages.fileSaved', { name: 'example.txt' })}</p>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        {locales.map(loc => <option key={loc}>{loc}</option>)}
      </select>
    </div>
  );
}
```

**API:**
- `t(key, params?)` - Translate a key with optional parameters
- `locale` - Current locale
- `locales` - Available locales
- `setLocale(locale)` - Change locale
- `loading` - Loading state

### Supported Languages

**Currently Implemented:**
- **English (en)** - Base language with complete translations
- **Spanish (es)** - Complete translations

**Adding New Languages:**

1. Create translation file in `locales/`:
```bash
touch locales/fr.json
```

2. Copy structure from `en.json` and translate:
```json
{
  "app": {
    "name": "Kate Neo",
    "tagline": "IDE Moderne avec Édition Puissante"
  }
}
```

3. Restart server to load new translations

### Security

**Protection Against:**
- **Path Injection:** Locale names are sanitized to allow only alphanumeric and hyphens
- **Path Validation:** Translation file paths are validated to be within locales directory
- **Format String Injection:** User input is separated from format strings in logging

## Integration

### Server Initialization

In `server/routes.ts`:
```typescript
import { getSettingsManager } from './settings-manager';
import { getI18nService } from './i18n-service';

// Initialize services
const settingsManager = getSettingsManager({ workspaceDir });
await settingsManager.initialize();

const i18nService = getI18nService({ localesDir: './locales' });
await i18nService.initialize();
```

### UI Integration

Settings panel is integrated into the sidebar:
```tsx
<TabsTrigger value="settings">
  <Settings className="h-4 w-4 mr-2" />
  Settings
</TabsTrigger>

<TabsContent value="settings">
  <SettingsPanel />
</TabsContent>
```

## Testing

### Manual Testing

#### Settings System

1. Open Settings panel from sidebar
2. Change scope between Global and Workspace
3. Modify editor settings (font size, tab size, etc.)
4. Verify changes are saved automatically
5. Close and reopen IDE to verify persistence
6. Test reset to defaults functionality

#### I18n System

1. Open Settings panel
2. Navigate to Appearance tab
3. Change language from English to Spanish
4. Verify UI text updates (Settings panel labels)
5. Restart IDE and verify language persists

### API Testing

#### Test Settings API
```bash
# Get all settings
curl http://localhost:5000/api/settings

# Get specific setting
curl http://localhost:5000/api/settings?key=editor.fontSize

# Update setting
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"scope":"workspace","key":"editor.fontSize","value":16}'

# Reset settings
curl -X POST http://localhost:5000/api/settings/reset \
  -H "Content-Type: application/json" \
  -d '{"scope":"workspace"}'
```

#### Test I18n API
```bash
# Get available locales
curl http://localhost:5000/api/i18n/locales

# Set locale
curl -X POST http://localhost:5000/api/i18n/locale \
  -H "Content-Type: application/json" \
  -d '{"locale":"es"}'

# Translate key
curl -X POST http://localhost:5000/api/i18n/translate \
  -H "Content-Type: application/json" \
  -d '{"key":"app.name"}'
```

## Best Practices

### Settings

1. **Use dot notation** for nested settings: `editor.minimap.enabled`
2. **Validate values** before saving to ensure type safety
3. **Provide defaults** for all settings in `DEFAULT_SETTINGS`
4. **Document settings** with clear descriptions
5. **Group related settings** in the UI for better UX

### I18n

1. **Use descriptive keys** that reflect the content: `messages.fileSaved` not `msg1`
2. **Organize translations** hierarchically by feature/component
3. **Keep translations up to date** when adding new features
4. **Test with parameters** to ensure interpolation works correctly
5. **Provide fallbacks** for missing translations

## Troubleshooting

### Settings Not Saving

- Check console for errors
- Verify write permissions on settings directory
- Check settings file is valid JSON
- Ensure scope is valid (global or workspace)

### Settings Not Loading

- Check settings file exists
- Verify settings file is valid JSON
- Check file permissions
- Look for initialization errors in server logs

### Locale Not Changing

- Verify translation file exists in `locales/`
- Check translation file is valid JSON
- Ensure locale name matches file name
- Check for API errors in console

### Translations Not Showing

- Verify key exists in translation file
- Check current locale is set correctly
- Look for missing translations in fallback locale
- Ensure useI18n hook is used correctly

## Future Enhancements

### Settings

- [ ] Settings sync across devices
- [ ] Settings import/export
- [ ] Settings validation against JSON schema
- [ ] Settings search functionality
- [ ] Per-language settings
- [ ] Settings history and rollback
- [ ] Settings templates

### I18n

- [ ] More languages (French, German, Chinese, Japanese)
- [ ] Pluralization support
- [ ] Date/time formatting
- [ ] Number formatting
- [ ] RTL (Right-to-Left) language support
- [ ] Translation editor UI
- [ ] Automatic translation suggestions
- [ ] Translation completeness indicators

## API Reference

Full API documentation:
- `shared/settings-types.ts` - Settings type definitions
- `shared/i18n-types.ts` - I18n type definitions
- `server/settings-manager.ts` - Settings manager implementation
- `server/i18n-service.ts` - I18n service implementation
- `client/src/components/SettingsPanel.tsx` - Settings UI component
- `client/src/hooks/useI18n.tsx` - I18n React hook

## Contributing

When adding Phase 4 features:

1. Add service implementation in `server/`
2. Create UI components in `client/src/components/`
3. Add API routes in `server/routes.ts`
4. Update type definitions in `shared/`
5. Add translations to all locale files
6. Add tests
7. Update this documentation

## License

MIT License - See LICENSE file for details
