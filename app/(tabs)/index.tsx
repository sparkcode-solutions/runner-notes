import { CoachOrb } from '@/components/CoachOrb';
import { RunMomentCard } from '@/components/RunMomentCard';
import { StarryNight } from '@/components/StarryNight';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/lib/auth-context';
import { useCoach } from '@/lib/coach-context';
import { useRunMoments } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const { isNight } = useCoach();
  const { runMoments, loading, refetch } = useRunMoments({ userId: user.id });
  const [refreshing, setRefreshing] = useState(false);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);

  // Refetch when screen comes into focus (e.g., after completing a run)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartRun = () => {
    router.push('/run/create');
  };

  const handleLongPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Show theme switcher (it handles its own animations now)
    setShowThemeSwitcher(true);
  };

  const handleCloseSwitcher = () => {
    // Hide theme switcher
    setShowThemeSwitcher(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      {/* Background Layer: Starry Night */}
      {isNight && <StarryNight />}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Run Moments</Text>
          <TouchableOpacity
            onPress={handleLongPress}
            style={styles.themeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="color-palette-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {runMoments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="footsteps-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No run moments yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Start your first run to create a moment</Text>
            <Text style={[styles.hintText, { color: theme.colors.textMuted }]}>
              Long-press anywhere to customize theme
            </Text>
          </View>
        ) : (
          <FlatList
            data={runMoments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RunMomentCard
                runMoment={item}
                journalPreview={item.journalPreview}
                featuredSnapUri={item.featuredSnapUri}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.accent}
                colors={[theme.colors.accent]}
              />
            }
          />
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.accent }]}
          onPress={handleStartRun}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color={theme.isDark ? '#000' : '#fff'} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Theme Switcher Modal */}
      <ThemeSwitcher
        visible={showThemeSwitcher}
        onClose={handleCloseSwitcher}
      />

      {/* Mindful Coach Standby Orb */}
      <CoachOrb />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  themeButton: {
    padding: 4,
  },
  list: {
    padding: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
