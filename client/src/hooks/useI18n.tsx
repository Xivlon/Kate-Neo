/**
 * i18n Hook for React Components
 * 
 * Provides easy access to translations and locale management
 */

import { useState, useEffect, useCallback } from 'react';
import type { TranslationDictionary } from '../../../shared/i18n-types';

interface UseI18nReturn {
  /** Current locale */
  locale: string;
  /** Available locales */
  locales: string[];
  /** Translate a key */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Set current locale */
  setLocale: (locale: string) => Promise<boolean>;
  /** Check if translations are loading */
  loading: boolean;
}

/**
 * Hook to use i18n in React components
 */
export function useI18n(): UseI18nReturn {
  const [locale, setLocaleState] = useState<string>('en');
  const [locales, setLocales] = useState<string[]>(['en']);
  const [translations, setTranslations] = useState<TranslationDictionary>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Load available locales and current locale on mount
  useEffect(() => {
    async function init() {
      try {
        // Get available locales
        const localesRes = await fetch('/api/i18n/locales');
        if (localesRes.ok) {
          const data = await localesRes.json();
          setLocales(data.locales || ['en']);
          setLocaleState(data.current || 'en');
        }

        // Get current translations
        const transRes = await fetch('/api/i18n/translations');
        if (transRes.ok) {
          const data = await transRes.json();
          setTranslations(data.translations || {});
        }
      } catch (error) {
        console.error('[useI18n] Initialization error:', error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  /**
   * Translate a key with optional parameters
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Get nested translation
      const parts = key.split('.');
      let value: string | TranslationDictionary | undefined = translations;

      for (const part of parts) {
        if (!value || typeof value === 'string') {
          return key; // Translation not found, return key
        }
        value = value[part];
      }

      if (typeof value !== 'string') {
        return key; // Translation not found, return key
      }

      // Interpolate parameters
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    },
    [translations]
  );

  /**
   * Set the current locale
   */
  const setLocale = useCallback(async (newLocale: string): Promise<boolean> => {
    try {
      // Call API to set locale
      const res = await fetch('/api/i18n/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (!data.success) {
        return false;
      }

      // Load new translations
      const transRes = await fetch('/api/i18n/translations');
      if (transRes.ok) {
        const transData = await transRes.json();
        setTranslations(transData.translations || {});
      }

      setLocaleState(newLocale);
      return true;
    } catch (error) {
      console.error('[useI18n] Set locale error:', error);
      return false;
    }
  }, []);

  return {
    locale,
    locales,
    t,
    setLocale,
    loading,
  };
}
