import { Platform } from 'react-native';

// Theme interface - defines a complete aesthetic
export interface AppTheme {
  id: string;
  name: string;
  description: string;
  
  // Colors
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentMuted: string;
    accentSoft: string;
    error: string;
    success: string;
    journalText: string;
    journalPrompt: string;
    // Card-specific
    cardBackground: string;
    cardOverlay: string;
    // Journal back face
    journalBackground: string;
    journalBorder: string;
  };
  
  // Typography
  fonts: {
    heading: string;
    body: string;
    journal: string;
  };
  
  // Card styles
  cardStyle: {
    borderRadius: number;
    placeholderColors: string[][];
    shadowOpacity: number;
  };
  
  // Is this a dark theme?
  isDark: boolean;
}

// Font families by platform
const getFontFamily = (style: 'sans' | 'serif' | 'rounded' | 'mono'): string => {
  const fonts = Platform.select({
    ios: {
      sans: 'System',
      serif: 'Georgia',
      rounded: 'System',
      mono: 'Menlo',
    },
    android: {
      sans: 'Roboto',
      serif: 'serif',
      rounded: 'Roboto',
      mono: 'monospace',
    },
    default: {
      sans: 'System',
      serif: 'serif',
      rounded: 'System',
      mono: 'monospace',
    },
  });
  return fonts![style] || fonts!.sans;
};

// ============================================
// THEME DEFINITIONS
// ============================================

export const midnightTheme: AppTheme = {
  id: 'midnight',
  name: 'Midnight',
  description: 'Deep blacks with warm amber accents',
  isDark: true,
  colors: {
    background: '#0D0D0F',
    surface: '#18181B',
    surfaceElevated: '#1F1F23',
    border: '#27272A',
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    accent: '#F59E0B',
    accentMuted: '#D97706',
    accentSoft: 'rgba(245, 158, 11, 0.15)',
    error: '#EF4444',
    success: '#22C55E',
    journalText: '#18181B', // Dark text for paper background
    journalPrompt: '#A1A1AA',
    cardBackground: '#1A1A1A',
    cardOverlay: 'rgba(0,0,0,0.4)',
    journalBackground: '#FAF6F1',
    journalBorder: 'rgba(139, 115, 85, 0.15)',
  },
  fonts: {
    heading: getFontFamily('sans'),
    body: getFontFamily('sans'),
    journal: getFontFamily('serif'),
  },
  cardStyle: {
    borderRadius: 20,
    placeholderColors: [
      ['#1a3a2f', '#0d1f19'],
      ['#2d3748', '#1a202c'],
      ['#44337a', '#2d2540'],
      ['#1e3a5f', '#0f1f33'],
      ['#5c4033', '#2d1f18'],
    ],
    shadowOpacity: 0.3,
  },
};

export const forestTheme: AppTheme = {
  id: 'forest',
  name: 'Forest',
  description: 'Deep greens and earthy tones',
  isDark: true,
  colors: {
    background: '#0C1810',
    surface: '#152418',
    surfaceElevated: '#1D3022',
    border: '#2A4233',
    textPrimary: '#E8F0E8',
    textSecondary: '#9BB09B',
    textMuted: '#6B8A6B',
    accent: '#4ADE80',
    accentMuted: '#22C55E',
    accentSoft: 'rgba(74, 222, 128, 0.15)',
    error: '#F87171',
    success: '#4ADE80',
    journalText: '#152418', // Dark text for paper background
    journalPrompt: '#9BB09B',
    cardBackground: '#152418',
    cardOverlay: 'rgba(0,20,10,0.5)',
    journalBackground: '#F0F4F0',
    journalBorder: 'rgba(74, 100, 74, 0.15)',
  },
  fonts: {
    heading: getFontFamily('sans'),
    body: getFontFamily('sans'),
    journal: getFontFamily('serif'),
  },
  cardStyle: {
    borderRadius: 16,
    placeholderColors: [
      ['#1a3a2f', '#0d2818'],
      ['#2d4a3a', '#1a3020'],
      ['#1e3d2e', '#0f2518'],
      ['#2a4535', '#152820'],
      ['#1d3828', '#0c1f12'],
    ],
    shadowOpacity: 0.25,
  },
};

export const dawnTheme: AppTheme = {
  id: 'dawn',
  name: 'Dawn',
  description: 'Soft pinks and golden warmth',
  isDark: false,
  colors: {
    background: '#FFF8F5',
    surface: '#FFFFFF',
    surfaceElevated: '#FFF0EB',
    border: '#FFE4DB',
    textPrimary: '#2D1F1A',
    textSecondary: '#7A6A62',
    textMuted: '#A89890',
    accent: '#E76F51',
    accentMuted: '#F4A261',
    accentSoft: 'rgba(231, 111, 81, 0.12)',
    error: '#DC2626',
    success: '#16A34A',
    journalText: '#3D2F2A',
    journalPrompt: '#8A7A72',
    cardBackground: '#FFFFFF',
    cardOverlay: 'rgba(255,248,245,0.7)',
    journalBackground: '#FFFBF8',
    journalBorder: 'rgba(200, 150, 130, 0.2)',
  },
  fonts: {
    heading: getFontFamily('sans'),
    body: getFontFamily('sans'),
    journal: getFontFamily('serif'),
  },
  cardStyle: {
    borderRadius: 24,
    placeholderColors: [
      ['#FFE4DB', '#FFD0C2'],
      ['#FFDDD3', '#FFC9B8'],
      ['#FFE8E0', '#FFD4C8'],
      ['#FFD5C8', '#FFC0AC'],
      ['#FFEAE3', '#FFD8CC'],
    ],
    shadowOpacity: 0.1,
  },
};

export const oceanTheme: AppTheme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Navy blues with teal accents',
  isDark: true,
  colors: {
    background: '#0A1628',
    surface: '#122236',
    surfaceElevated: '#1A3048',
    border: '#234060',
    textPrimary: '#E8F4FF',
    textSecondary: '#94B8D8',
    textMuted: '#6890B0',
    accent: '#06B6D4',
    accentMuted: '#0891B2',
    accentSoft: 'rgba(6, 182, 212, 0.15)',
    error: '#FB7185',
    success: '#34D399',
    journalText: '#122236', // Dark text for paper background
    journalPrompt: '#94B8D8',
    cardBackground: '#122236',
    cardOverlay: 'rgba(10,22,40,0.5)',
    journalBackground: '#F0F7FC',
    journalBorder: 'rgba(100, 150, 180, 0.15)',
  },
  fonts: {
    heading: getFontFamily('sans'),
    body: getFontFamily('sans'),
    journal: getFontFamily('serif'),
  },
  cardStyle: {
    borderRadius: 18,
    placeholderColors: [
      ['#1e3a5f', '#0f2540'],
      ['#1a3550', '#0c1f35'],
      ['#1c3858', '#0e2442'],
      ['#183250', '#0a1a30'],
      ['#1f3d62', '#102745'],
    ],
    shadowOpacity: 0.35,
  },
};

export const paperTheme: AppTheme = {
  id: 'paper',
  name: 'Paper',
  description: 'Minimalist cream and black',
  isDark: false,
  colors: {
    background: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceElevated: '#F5F3F0',
    border: '#E8E4DE',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#1A1A1A',
    accentMuted: '#333333',
    accentSoft: 'rgba(26, 26, 26, 0.08)',
    error: '#B91C1C',
    success: '#15803D',
    journalText: '#2A2A2A',
    journalPrompt: '#777777',
    cardBackground: '#FFFFFF',
    cardOverlay: 'rgba(250,248,245,0.8)',
    journalBackground: '#FFFEF8',
    journalBorder: 'rgba(100, 100, 80, 0.1)',
  },
  fonts: {
    heading: getFontFamily('serif'),
    body: getFontFamily('sans'),
    journal: getFontFamily('serif'),
  },
  cardStyle: {
    borderRadius: 12,
    placeholderColors: [
      ['#E8E4DE', '#D8D4CE'],
      ['#F0ECE6', '#E0DCD6'],
      ['#E4E0DA', '#D4D0CA'],
      ['#ECE8E2', '#DCD8D2'],
      ['#E6E2DC', '#D6D2CC'],
    ],
    shadowOpacity: 0.08,
  },
};

export const neonTheme: AppTheme = {
  id: 'neon',
  name: 'Neon',
  description: 'High energy with electric accents',
  isDark: true,
  colors: {
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceElevated: '#1A1A25',
    border: '#2A2A3A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0C0',
    textMuted: '#707085',
    accent: '#A855F7',
    accentMuted: '#9333EA',
    accentSoft: 'rgba(168, 85, 247, 0.15)',
    error: '#FF6B6B',
    success: '#00FF88',
    journalText: '#12121A', // Dark text for paper background
    journalPrompt: '#B0B0C0',
    cardBackground: '#12121A',
    cardOverlay: 'rgba(10,10,15,0.6)',
    journalBackground: '#F8F8FF',
    journalBorder: 'rgba(168, 85, 247, 0.2)',
  },
  fonts: {
    heading: getFontFamily('sans'),
    body: getFontFamily('sans'),
    journal: getFontFamily('sans'),
  },
  cardStyle: {
    borderRadius: 16,
    placeholderColors: [
      ['#2D1B4E', '#1A0F2E'],
      ['#1B2D4E', '#0F1A2E'],
      ['#4E1B3D', '#2E0F22'],
      ['#1B4E3D', '#0F2E22'],
      ['#3D1B4E', '#220F2E'],
    ],
    shadowOpacity: 0.4,
  },
};

// All themes array
export const ALL_THEMES: AppTheme[] = [
  midnightTheme,
  forestTheme,
  dawnTheme,
  oceanTheme,
  paperTheme,
  neonTheme,
];

// Default theme
export const DEFAULT_THEME = midnightTheme;

// Get theme by ID
export function getThemeById(id: string): AppTheme {
  return ALL_THEMES.find(t => t.id === id) || DEFAULT_THEME;
}

// Shared spacing, sizing, and typography scales (theme-independent)
export const themeConstants = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    xxxl: 34,
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};
