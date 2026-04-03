import { useState, useEffect } from 'react';
import { Theme } from '../types';
import { safeLocalStorage } from '../utils/storage';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = safeLocalStorage.getItem('btq_theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    safeLocalStorage.setItem('btq_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggleTheme };
};
