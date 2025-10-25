/**
 * Internationalization (i18n) Service
 * 
 * Provides multi-language support for Kate Neo IDE
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import {
  SupportedLocale,
  TranslationDictionary,
  TranslationRequest,
  TranslationResponse,
  LocaleChangeEvent,
  AvailableLocalesResponse,
} from '../shared/i18n-types.js';

/**
 * I18n Service Configuration
 */
interface I18nServiceConfig {
  /** Directory containing translation files */
  localesDir?: string;
  /** Default locale */
  defaultLocale?: string;
  /** Fallback locale when translation not found */
  fallbackLocale?: string;
}

/**
 * I18n Service
 * 
 * Manages translations and locale switching
 */
export class I18nService extends EventEmitter {
  private currentLocale: string;
  private fallbackLocale: string;
  private translations: Map<string, TranslationDictionary> = new Map();
  private config: Required<I18nServiceConfig>;
  private initialized = false;

  constructor(config: I18nServiceConfig = {}) {
    super();
    
    this.config = {
      localesDir: config.localesDir || path.join(process.cwd(), 'locales'),
      defaultLocale: config.defaultLocale || SupportedLocale.English,
      fallbackLocale: config.fallbackLocale || SupportedLocale.English,
    };
    
    this.currentLocale = this.config.defaultLocale;
    this.fallbackLocale = this.config.fallbackLocale;
  }

  /**
   * Initialize the i18n service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure locales directory exists
      await fs.mkdir(this.config.localesDir, { recursive: true });

      // Load all available translations
      await this.loadAllTranslations();

      this.initialized = true;
      console.log('[I18nService] Initialized with locale:', this.currentLocale);
    } catch (error) {
      console.error('[I18nService] Initialization failed:', error);
      // Don't throw - the service should work even if no translations are available
    }
  }

  /**
   * Load all available translation files
   */
  private async loadAllTranslations(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.localesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const locale = path.basename(file, '.json');
        await this.loadTranslation(locale);
      }
      
      console.log('[I18nService] Loaded translations for locales:', Array.from(this.translations.keys()));
    } catch (error) {
      console.error('[I18nService] Failed to load translations:', error);
    }
  }

  /**
   * Load translation file for a specific locale
   */
  private async loadTranslation(locale: string): Promise<void> {
    // Sanitize locale to prevent path injection
    // Only allow alphanumeric characters and hyphens
    const sanitizedLocale = locale.replace(/[^a-zA-Z0-9-]/g, '');
    if (sanitizedLocale !== locale || locale.includes('..')) {
      console.error('[I18nService] Invalid locale format:', locale);
      return;
    }
    
    const translationPath = path.join(this.config.localesDir, `${sanitizedLocale}.json`);
    
    // Ensure the resolved path is within the locales directory
    const resolvedPath = path.resolve(translationPath);
    const resolvedLocalesDir = path.resolve(this.config.localesDir);
    
    if (!resolvedPath.startsWith(resolvedLocalesDir)) {
      console.error('[I18nService] Path outside locales directory:', translationPath);
      return;
    }
    
    try {
      const data = await fs.readFile(resolvedPath, 'utf-8');
      const translations = JSON.parse(data) as TranslationDictionary;
      this.translations.set(sanitizedLocale, translations);
      console.log('[I18nService] Loaded translation for locale:', sanitizedLocale);
    } catch (error) {
      console.error('[I18nService] Failed to load translation for locale', error);
    }
  }

  /**
   * Get a nested value from translations using dot notation
   */
  private getNestedTranslation(key: string, translations: TranslationDictionary): string | undefined {
    const parts = key.split('.');
    let current: string | TranslationDictionary | undefined = translations;
    
    for (const part of parts) {
      if (!current || typeof current === 'string') {
        return undefined;
      }
      current = current[part];
    }
    
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Interpolate parameters in a translation string
   */
  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Translate a key
   */
  translate(request: TranslationRequest): TranslationResponse {
    const { key, params, fallback } = request;
    
    try {
      // Try to get translation in current locale
      let translation: string | undefined;
      const currentTranslations = this.translations.get(this.currentLocale);
      
      if (currentTranslations) {
        translation = this.getNestedTranslation(key, currentTranslations);
      }
      
      // If not found, try fallback locale
      if (!translation && this.currentLocale !== this.fallbackLocale) {
        const fallbackTranslations = this.translations.get(this.fallbackLocale);
        if (fallbackTranslations) {
          translation = this.getNestedTranslation(key, fallbackTranslations);
        }
      }
      
      // If still not found, use fallback or key
      if (!translation) {
        translation = fallback || key;
      }
      
      // Interpolate parameters
      const text = this.interpolate(translation, params);
      
      return {
        success: true,
        text,
      };
    } catch (error) {
      console.error('[I18nService] Translation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        text: fallback || key,
      };
    }
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Set current locale
   */
  async setLocale(locale: string): Promise<boolean> {
    try {
      // Load translation if not already loaded
      if (!this.translations.has(locale)) {
        await this.loadTranslation(locale);
      }
      
      // Check if translation exists
      if (!this.translations.has(locale)) {
        console.error(`[I18nService] Locale not available: ${locale}`);
        return false;
      }
      
      const previousLocale = this.currentLocale;
      this.currentLocale = locale;
      
      // Emit change event
      const changeEvent: LocaleChangeEvent = {
        previousLocale,
        newLocale: locale,
        timestamp: Date.now(),
      };
      this.emit('localeChanged', changeEvent);
      
      console.log(`[I18nService] Locale changed from ${previousLocale} to ${locale}`);
      return true;
    } catch (error) {
      console.error('[I18nService] Failed to set locale:', error);
      return false;
    }
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): AvailableLocalesResponse {
    return {
      locales: Array.from(this.translations.keys()),
      current: this.currentLocale,
    };
  }

  /**
   * Get all translations for current locale
   */
  getAllTranslations(): TranslationDictionary {
    return this.translations.get(this.currentLocale) || {};
  }

  /**
   * Get all translations for a specific locale
   */
  getTranslationsForLocale(locale: string): TranslationDictionary | undefined {
    return this.translations.get(locale);
  }

  /**
   * Add or update translations for a locale
   */
  async addTranslations(locale: string, translations: TranslationDictionary): Promise<void> {
    this.translations.set(locale, translations);
    
    // Save to disk
    const translationPath = path.join(this.config.localesDir, `${locale}.json`);
    try {
      await fs.writeFile(translationPath, JSON.stringify(translations, null, 2), 'utf-8');
      console.log(`[I18nService] Saved translations for locale: ${locale}`);
    } catch (error) {
      console.error(`[I18nService] Failed to save translations for ${locale}:`, error);
      throw error;
    }
  }

  /**
   * Convenience method: translate with simple signature
   */
  t(key: string, params?: Record<string, string | number>): string {
    const response = this.translate({ key, params });
    return response.text || key;
  }
}

// Export singleton instance
let i18nServiceInstance: I18nService | null = null;

export function getI18nService(config?: I18nServiceConfig): I18nService {
  if (!i18nServiceInstance) {
    i18nServiceInstance = new I18nService(config);
  }
  return i18nServiceInstance;
}
