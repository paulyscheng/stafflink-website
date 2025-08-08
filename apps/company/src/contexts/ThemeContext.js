import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightTheme = {
    // Background colors
    background: '#f9fafb',
    surface: '#ffffff',
    card: '#ffffff',
    
    // Text colors
    text: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Border colors
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    
    // Brand colors
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // Status bar
    statusBarStyle: 'dark',
    
    // Shadows
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    }
  };

  const darkTheme = {
    // Background colors
    background: '#111827',
    surface: '#1f2937',
    card: '#374151',
    
    // Text colors
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textMuted: '#9ca3af',
    
    // Border colors
    border: '#4b5563',
    borderLight: '#374151',
    
    // Brand colors
    primary: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    
    // Status bar
    statusBarStyle: 'light',
    
    // Shadows
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    }
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    theme: currentTheme,
    toggleTheme,
    colors: currentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};