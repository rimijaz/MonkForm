import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'light' ? false : true;
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem('reduceMotion') === 'true';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      document.body.classList.add('high-contrast');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrast', highContrast);
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
      document.body.classList.add('reduce-motion');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
      document.body.classList.remove('reduce-motion');
    }
    localStorage.setItem('reduceMotion', reduceMotion);
  }, [reduceMotion]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const toggleReduceMotion = () => {
    setReduceMotion(prev => !prev);
  };

  const value = {
    isDarkMode,
    highContrast,
    reduceMotion,
    toggleTheme,
    toggleHighContrast,
    toggleReduceMotion
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
