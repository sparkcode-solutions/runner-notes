/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Runner Notes Dark Theme - Mindful Sanctuary Aesthetic
export const runnerTheme = {
  colors: {
    // Base colors - warm dark tones
    background: '#0D0D0F',
    surface: '#18181B',
    surfaceElevated: '#1F1F23',
    border: '#27272A',
    
    // Text hierarchy
    textPrimary: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    
    // Accent - warm amber/gold for mindful feel (not sporty teal)
    accent: '#F59E0B',
    accentMuted: '#D97706',
    accentSoft: 'rgba(245, 158, 11, 0.15)',
    
    // Semantic colors
    error: '#EF4444',
    success: '#22C55E',
    
    // Journal-specific
    journalText: '#E4E4E7',
    journalPrompt: '#A1A1AA',
  },
  
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
  
  // Typography scale
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
    xxxl: 34,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights for readability
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  
  // Shadows for depth
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Journal-specific typography
export const journalTypography = {
  // For journal preview/excerpt text
  excerpt: {
    fontSize: runnerTheme.fontSize.md,
    lineHeight: runnerTheme.fontSize.md * runnerTheme.lineHeight.relaxed,
    color: runnerTheme.colors.journalText,
    fontWeight: runnerTheme.fontWeight.normal,
    fontStyle: 'normal' as const,
  },
  
  // For "Tap to add your thoughts..." prompt
  prompt: {
    fontSize: runnerTheme.fontSize.md,
    lineHeight: runnerTheme.fontSize.md * runnerTheme.lineHeight.relaxed,
    color: runnerTheme.colors.journalPrompt,
    fontWeight: runnerTheme.fontWeight.normal,
    fontStyle: 'italic' as const,
  },
  
  // For trail name
  trailName: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    fontWeight: runnerTheme.fontWeight.medium,
  },
  
  // For stats (distance, pace, time)
  stats: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.textMuted,
    fontWeight: runnerTheme.fontWeight.normal,
  },
};
