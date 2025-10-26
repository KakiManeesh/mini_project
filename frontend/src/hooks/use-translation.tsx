import { useLanguage, Language } from './use-language';
import { useState, useEffect } from 'react';

type TranslationObject = Record<string, string | number | boolean | Record<string, any>>;

export function useTranslation() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<TranslationObject>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../translations/${language}.json`);
        setTranslations(module.default);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to English
        const module = await import('../translations/en.json');
        setTranslations(module.default);
      }
    };

    loadTranslations();
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, language, translations };
}
