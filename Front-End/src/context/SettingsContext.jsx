import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { translations } from "../translations";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem("lang") || "en";
    } catch (error) {
      console.error("Error reading language from localStorage:", error);
      return "en";
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch (error) {
      console.error("Error reading theme from localStorage:", error);
      return "dark";
    }
  });

  // Apply language settings
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.lang = language;

      if (language === 'ar') {
        root.dir = 'rtl';
      } else {
        root.dir = 'ltr';
      }

      localStorage.setItem("lang", language);
    } catch (error) {
      console.error("Error applying language settings:", error);
    }
  }, [language]);

  // Apply theme settings
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error applying theme settings:", error);
    }
  }, [theme]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const t = useCallback((key) => {
    try {
      if (translations[language] && translations[language][key]) {
        return translations[language][key];
      }
      return key;
    } catch (error) {
      console.error("Translation error:", error);
      return key;
    }
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
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
