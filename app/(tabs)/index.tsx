import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useRunMoments } from '@/lib/hooks';
import { RunMomentCard } from '@/components/RunMomentCard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const { runMoments, loading, refetch } = useRunMoments({ userId: user?.id ?? null });
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={runnerTheme.colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Run Moments</Text>
        <View style={{ width: 24 }} />
      </View>

      {runMoments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="footsteps-outline" size={64} color={runnerTheme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No run moments yet</Text>
          <Text style={styles.emptySubtitle}>Start your first run to create a moment</Text>
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
              tintColor={runnerTheme.colors.accent}
              colors={[runnerTheme.colors.accent]}
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleStartRun} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color={runnerTheme.colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: runnerTheme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: runnerTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: runnerTheme.spacing.lg,
    paddingVertical: runnerTheme.spacing.md,
  },
  title: {
    fontSize: runnerTheme.fontSize.xxl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
  },
  list: {
    padding: runnerTheme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: runnerTheme.spacing.xl,
  },
  emptyTitle: {
    fontSize: runnerTheme.fontSize.lg,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
    marginTop: runnerTheme.spacing.lg,
    marginBottom: runnerTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: runnerTheme.spacing.xl,
    right: runnerTheme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: runnerTheme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
