import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en/translation.json';
import hi from './hi/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr', 'kn', 'gu'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'udyam-language',
      caches: ['localStorage'],
    },
  });

export function switchLanguage(targetLang) {
  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const newLang = targetLang || (currentLang.startsWith('hi') ? 'en' : 'hi');
  const normalized = newLang.startsWith('hi') ? 'hi' : 'en';

  i18n.changeLanguage(normalized);
  if (typeof window !== 'undefined') {
    localStorage.setItem('udyam-language', normalized);
    localStorage.setItem('i18nextLng', normalized);
    document.documentElement.lang = normalized;
  }
  return normalized;
}

export function getCurrentLanguage() {
  const current = i18n.resolvedLanguage || i18n.language || 'en';
  return current.startsWith('hi') ? 'hi' : 'en';
}

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    const normalized = (lng || 'en').startsWith('hi') ? 'hi' : 'en';
    localStorage.setItem('udyam-language', normalized);
    localStorage.setItem('i18nextLng', normalized);
    document.documentElement.lang = normalized;
  });
}

export default i18n;
