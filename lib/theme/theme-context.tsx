import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, DEFAULT_THEME, getThemeById, ALL_THEMES, themeConstants } from './themes';

const THEME_STORAGE_KEY = 'runner_notes_theme';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (themeId: string) => void;
  allThemes: AppTheme[];
  constants: typeof themeConstants;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedThemeId) {
          const savedTheme = getThemeById(savedThemeId);
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Set theme and persist
  const setTheme = useCallback(async (themeId: string) => {
    const newTheme = getThemeById(themeId);
    setThemeState(newTheme);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        allThemes: ALL_THEMES,
        constants: themeConstants,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook that returns combined theme (colors + constants)
export const useTheme = () => {
  const { theme, constants } = useAppTheme();
  
  return {
    ...theme,
    ...constants,
    // Shadow helpers
    shadow: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.cardStyle.shadowOpacity * 0.6,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.cardStyle.shadowOpacity * 0.8,
        shadowRadius: 8,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: theme.cardStyle.shadowOpacity,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  };
};
