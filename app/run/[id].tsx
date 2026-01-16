import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { getRunMoment, getJournals, type RunMoment, type Journal } from '@/lib/firestore';
import { formatDistance, formatDuration, formatPace } from '@/lib/location';
import { Card } from '@/components/ui/card';
import { Ionicons } from '@expo/vector-icons';

export default function RunMomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [runMoment, setRunMoment] = useState<RunMoment | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const unsubscribeRun = getRunMoment(user.uid, id).onSnapshot((doc) => {
      if (doc.exists()) {
        setRunMoment({ id: doc.id, ...doc.data() } as RunMoment);
      }
      setLoading(false);
    });

    const unsubscribeJournals = getJournals(user.uid, id).onSnapshot((snapshot) => {
      const journalsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Journal[];
      setJournals(journalsList);
    });

    return () => {
      unsubscribeRun();
      unsubscribeJournals();
    };
  }, [user, id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={runnerTheme.colors.accent} />
      </View>
    );
  }

  if (!runMoment) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Run moment not found</Text>
      </View>
    );
  }

  const date = runMoment.createdAt?.toDate?.() || new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={runnerTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Run Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.trailName}>{runMoment.trailName}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatItem
              icon="navigate"
              label="Distance"
              value={`${formatDistance(runMoment.distance)} km`}
            />
            <StatItem
              icon="time"
              label="Duration"
              value={formatDuration(runMoment.duration)}
            />
            <StatItem
              icon="speedometer"
              label="Avg Pace"
              value={`${formatPace(runMoment.avgPace)}/km`}
            />
          </View>
        </Card>

        {/* Map Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <Card style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={runnerTheme.colors.textSecondary} />
            <Text style={styles.placeholderText}>Map view coming soon</Text>
          </Card>
        </View>

        {/* Run Journals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Journals</Text>
            <TouchableOpacity onPress={() => router.push(`/run/journal/new?runId=${id}`)}>
              <Ionicons name="add-circle" size={28} color={runnerTheme.colors.accent} />
            </TouchableOpacity>
          </View>
          {journals.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No journals yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your thoughts about this run</Text>
            </Card>
          ) : (
            journals.map((journal) => (
              <TouchableOpacity
                key={journal.id}
                onPress={() => router.push(`/run/journal/${journal.id}?runId=${id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.journalCard}>
                  <Text style={styles.journalContent} numberOfLines={3}>
                    {journal.content}
                  </Text>
                  <Text style={styles.journalDate}>
                    {journal.createdAt?.toDate?.()?.toLocaleString() || ''}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Run Snaps - UI Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Run Snaps</Text>
          <Card style={styles.placeholderCard}>
            <Ionicons name="camera-outline" size={48} color={runnerTheme.colors.textSecondary} />
            <Text style={styles.placeholderText}>Photo capture coming soon</Text>
          </Card>
        </View>

        {/* Run Memos - UI Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Run Memos</Text>
          <Card style={styles.placeholderCard}>
            <Ionicons name="mic-outline" size={48} color={runnerTheme.colors.textSecondary} />
            <Text style={styles.placeholderText}>Voice memos coming soon</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatItem: React.FC<{ icon: any; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color={runnerTheme.colors.accent} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
    fontSize: runnerTheme.fontSize.xl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
  },
  content: {
    padding: runnerTheme.spacing.lg,
  },
  section: {
    marginBottom: runnerTheme.spacing.xl,
  },
  trailName: {
    fontSize: runnerTheme.fontSize.xxl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.xs,
  },
  date: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
  },
  statsCard: {
    marginBottom: runnerTheme.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    marginTop: runnerTheme.spacing.xs,
  },
  statValue: {
    fontSize: runnerTheme.fontSize.lg,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
    marginTop: runnerTheme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: runnerTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: runnerTheme.fontSize.lg,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.md,
  },
  mapPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCard: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
    marginTop: runnerTheme.spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: runnerTheme.spacing.xl,
  },
  emptyText: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.xs,
  },
  emptySubtext: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    textAlign: 'center',
  },
  journalCard: {
    marginBottom: runnerTheme.spacing.md,
  },
  journalContent: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.sm,
  },
  journalDate: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.textSecondary,
  },
  errorText: {
    fontSize: runnerTheme.fontSize.lg,
    color: runnerTheme.colors.textSecondary,
  },
});
