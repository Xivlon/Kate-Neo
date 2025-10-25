/**
 * Internationalization (i18n) Type Definitions
 * 
 * Defines types for multi-language support in Kate Neo IDE
 */

/**
 * Supported locales
 */
export enum SupportedLocale {
  English = 'en',
  Spanish = 'es',
  French = 'fr',
  German = 'de',
  Chinese = 'zh',
  Japanese = 'ja',
}

/**
 * Translation dictionary structure
 * Maps translation keys to localized strings
 */
export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

/**
 * Translation file structure
 */
export interface TranslationFile {
  /** Locale identifier */
  locale: string;
  /** Translations */
  translations: TranslationDictionary;
}

/**
 * Translation request
 */
export interface TranslationRequest {
  /** Translation key (dot-notation supported) */
  key: string;
  /** Parameters for interpolation */
  params?: Record<string, string | number>;
  /** Fallback value if translation not found */
  fallback?: string;
}

/**
 * Translation response
 */
export interface TranslationResponse {
  /** Success status */
  success: boolean;
  /** Translated text */
  text?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Locale change event
 */
export interface LocaleChangeEvent {
  /** Previous locale */
  previousLocale: string;
  /** New locale */
  newLocale: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Available locales response
 */
export interface AvailableLocalesResponse {
  /** Available locales */
  locales: string[];
  /** Current locale */
  current: string;
}
