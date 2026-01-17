import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { DatabaseProvider, useDatabase } from '@/lib/db';
import { runnerTheme } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { loading: authLoading } = useAuth();
  const { isReady: dbReady } = useDatabase();

  // Show loading while database initializes or auth is loading
  if (!dbReady || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: runnerTheme.colors.background }}>
        <ActivityIndicator size="large" color={runnerTheme.colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="run/create" options={{ headerShown: false }} />
      <Stack.Screen name="run/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="run/journal/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <DatabaseProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
