import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { en, fr, TranslationKey } from './translations';

export type Language = 'en' | 'fr';

const STORAGE_KEY = '@market_journal/language';

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { en, fr };

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'fr') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'en' ? 'fr' : 'en';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey) => DICTIONARIES[language][key], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
