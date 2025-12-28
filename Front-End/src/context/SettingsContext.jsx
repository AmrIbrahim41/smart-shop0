import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { translations } from "../translations";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("lang") || "en");

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;

    if (language === 'ar') {
      root.dir = 'rtl';
    } else {
      root.dir = 'ltr';
    }

    localStorage.setItem("lang", language);

  
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);


  }, [theme]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const t = useCallback((key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    return key; 
  }, [language]);

  const value = useMemo(() => ({
    language,
    theme,
    toggleLanguage,
    toggleTheme,
    t
  }), [language, theme, toggleLanguage, toggleTheme, t]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};