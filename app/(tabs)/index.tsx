import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { getRunMoments, type RunMoment } from '@/lib/firestore';
import { RunMomentCard } from '@/components/RunMomentCard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [runMoments, setRunMoments] = useState<RunMoment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = getRunMoments(user.uid).onSnapshot((snapshot) => {
      const moments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RunMoment[];
      setRunMoments(moments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartRun = () => {
    router.push('/run/create');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="exit-outline" size={24} color={runnerTheme.colors.textSecondary} />
        </TouchableOpacity>
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
          renderItem={({ item }) => <RunMomentCard runMoment={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
