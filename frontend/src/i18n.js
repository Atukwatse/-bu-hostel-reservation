import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import lg from './locales/lg.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import sw from './locales/sw.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      lg: { translation: lg },
      zh: { translation: zh },
      fr: { translation: fr },
      sw: { translation: sw },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bu_lang',
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

export default i18n;
