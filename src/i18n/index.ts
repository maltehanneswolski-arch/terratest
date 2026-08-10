import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './local';

const SUPPORTED = ['en', 'de'] as const;
type Supported = (typeof SUPPORTED)[number];

function readSavedLanguage(): Supported {
  try {
    const saved = localStorage.getItem('language');
    if (saved && (SUPPORTED as readonly string[]).includes(saved)) {
      return saved as Supported;
    }
    // No explicit choice yet — follow the browser, since a German visitor
    // shouldn't have to hunt for the toggle on first load.
    const preferred = navigator.languages?.find((tag) =>
      (SUPPORTED as readonly string[]).includes(tag.slice(0, 2)),
    );
    if (preferred) return preferred.slice(0, 2) as Supported;
  } catch {
    // localStorage or navigator unavailable — fall through to the default.
  }
  return 'en';
}

const savedLanguage = readSavedLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Persist the choice and keep <html lang> accurate.
 *
 * The chosen language used to be read at startup but never written, so
 * switching to German lasted only until the next reload. Setting `lang` also
 * matters for screen readers, which otherwise keep reading German text with an
 * English pronunciation dictionary.
 */
function applyLanguage(language: string) {
  const lang = (SUPPORTED as readonly string[]).includes(language) ? language : 'en';
  document.documentElement.setAttribute('lang', lang);
  try {
    localStorage.setItem('language', lang);
  } catch {
    // Storage disabled; the language still applies for this visit.
  }
}

applyLanguage(savedLanguage);
i18n.on('languageChanged', applyLanguage);

export default i18n;
