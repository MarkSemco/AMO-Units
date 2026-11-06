import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'amo-units-theme';

const defaultThemeContext: ThemeContextType = {
  theme: 'dark',
  toggleTheme: () => {
    // App is permanently locked to dark mode for AMO lab optics environment
  },
  setTheme: () => {
    // App is permanently locked to dark mode
  }
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {
      // Ignore localStorage access errors in restrictive environments
    }
  }, []);

  const toggleTheme = () => {
    // Permanently locked to dark mode
  };

  const setTheme = () => {
    // Permanently locked to dark mode
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return defaultThemeContext;
  }
  return context;
};

