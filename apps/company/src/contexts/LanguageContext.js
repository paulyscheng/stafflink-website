import React, { createContext, useContext, useState } from 'react';
import { languages } from '../localization/languages';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh'); // Default to Chinese
  
  const t = (key) => {
    return languages[currentLanguage][key] || key;
  };
  
  const switchLanguage = (lang) => {
    setCurrentLanguage(lang);
  };
  
  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      t,
      switchLanguage,
      setLanguage: switchLanguage, // Add alias for compatibility
      isChineseSelected: currentLanguage === 'zh',
      isEnglishSelected: currentLanguage === 'en'
    }}>
      {children}
    </LanguageContext.Provider>
  );
};