import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';

// Retrieve saved language preference or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

// Set initial document direction and html lang attribute
document.documentElement.dir = savedLanguage === 'ur' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLanguage;

// Configure i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ur: { translation: ur }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    // Add additional configuration for better RTL support
    supportedLngs: ['en', 'ur'],
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Update language settings when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.dir = lng === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // Force a re-render by triggering a resize event
  window.dispatchEvent(new Event('resize'));
  
  // Force Material-UI components to update their direction
  document.body.style.direction = lng === 'ur' ? 'rtl' : 'ltr';
});

export default i18n;
