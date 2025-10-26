import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'ml';

export interface LanguageInfo {
  code: Language;
  name: string;
  native: string;
  flag: string;
}

export const languages: Record<Language, LanguageInfo> = {
  'en': { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  'hi': { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  'te': { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  'ta': { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  'ml': { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("newsLanguage") as Language;
    if (savedLanguage && languages[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("newsLanguage", language);
  }, [language]);

  const languageInfo = languages[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
