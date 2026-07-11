import React, { createContext, useContext, useState } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage;
  if (!lang) return 'en';
  const prefix = lang.split('-')[0].toLowerCase();
  if (['en', 'nl', 'es'].includes(prefix)) {
    return prefix;
  }
  return 'en';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('replyvera_ui_language') || getBrowserLanguage();
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('replyvera_ui_language', lang);
  };

  const t = (key, replaces = {}) => {
    const dict = translations[language] || translations['en'];
    let text = dict[key] || translations['en'][key] || key;
    
    // Replace template parameters (e.g. {count} or {name})
    Object.keys(replaces).forEach(k => {
      text = text.replace(new RegExp(`{${k}}`, 'g'), replaces[k]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
