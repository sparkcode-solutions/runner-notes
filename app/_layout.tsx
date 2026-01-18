import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { CoachProvider } from '@/lib/coach-context';
import { DatabaseProvider, useDatabase } from '@/lib/db';
import { ThemeProvider, useAppTheme, useTheme } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { isReady: dbReady } = useDatabase();
  const theme = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !dbReady) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!user.coachMode && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [user, dbReady, authLoading, segments]);

  // Show loading while database initializes or auth is loading
  if (!dbReady || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="run/create" options={{ headerShown: false }} />
      <Stack.Screen name="run/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="run/journal/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

function ThemedApp() {
  const { theme } = useAppTheme();

  // Use dark or light nav theme based on app theme
  const navTheme = theme.isDark ? DarkTheme : DefaultTheme;

  return (
    <NavThemeProvider value={navTheme}>
      <RootLayoutNav />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <ThemeProvider>
          <CoachProvider>
            <ThemedApp />
          </CoachProvider>
        </ThemeProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
