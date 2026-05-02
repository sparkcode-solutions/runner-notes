import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { ReflectionEngine } from '@/lib/reflection';
import { useAuth } from '@/lib/auth-context';
import { useRunMoment, useJournals, useRunSnaps } from '@/lib/hooks';
import { formatDistance, formatDuration, formatPace } from '@/lib/location';
import { Card } from '@/components/ui/card';
import { InsightBlock } from '@/components/InsightBlock';
import { CameraCapture } from '@/components/CameraCapture';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAP_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // 3 columns with spacing

export default function RunMomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const { runMoment, loading } = useRunMoment({
    userId: user.id,
    runMomentId: id ?? null
  });
  const { journals } = useJournals({ runMomentId: id ?? null });
  const { snaps, featuredSnap, addSnap, deleteSnap, setFeatured } = useRunSnaps({
    runMomentId: id ?? null
  });

  const [showCamera, setShowCamera] = useState(false);

  const handleCaptureSnap = async (uri: string, caption?: string, fromGallery?: boolean) => {
    // Let the CameraCapture component handle errors so the modal doesn't close on failure
    await addSnap(uri, caption, fromGallery);
  };

  const handleSnapPress = (snapId: string, isFeatured: boolean) => {
    Alert.alert(
      'Snap Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        !isFeatured ? {
          text: 'Set as Featured',
          onPress: () => setFeatured(snapId),
        } : null,
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Snap',
              'Are you sure you want to delete this snap?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteSnap(snapId) },
              ]
            );
          },
        },
      ].filter(Boolean) as any
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!runMoment) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Run moment not found</Text>
      </View>
    );
  }

  const date = runMoment.createdAt instanceof Date
    ? runMoment.createdAt
    : new Date(runMoment.createdAt);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Build context for AI insight
  const latestJournal = journals.length > 0 ? journals[0].content : null;
  const context = ReflectionEngine.buildContext(runMoment, latestJournal);
  const vibePrompt = ReflectionEngine.generateVibePrompt(context);
  const aiReflection = runMoment.coachNote || ReflectionEngine.generateReflection(context);
  const insightMode = aiReflection ? 'insight' : 'prompt';
  const insightText = aiReflection || vibePrompt;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Run Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.trailName, { color: theme.colors.textPrimary }]}>{runMoment.trailName}</Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{formattedDate}</Text>
        </View>

        {/* AI Insight Block */}
        <Card style={[styles.insightCard, { backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border }]}>
          <InsightBlock
            mode={insightMode}
            text={insightText}
            hasNewContent={!!aiReflection}
          />
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <StatItem
              icon="navigate"
              label="Distance"
              value={`${formatDistance(runMoment.distance)} km`}
              theme={theme}
            />
            <StatItem
              icon="time"
              label="Duration"
              value={formatDuration(runMoment.duration)}
              theme={theme}
            />
            <StatItem
              icon="speedometer"
              label="Avg Pace"
              value={`${formatPace(runMoment.avgPace)}/km`}
              theme={theme}
            />
          </View>
        </Card>

        {/* Run Snaps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Run Snaps</Text>
            <TouchableOpacity onPress={() => setShowCamera(true)}>
              <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
            </TouchableOpacity>
          </View>

          {snaps.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="camera-outline" size={40} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No snaps yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Tap + to capture moments from your run</Text>
            </Card>
          ) : (
            <View style={styles.snapsGrid}>
              {snaps.map((snap) => (
                <TouchableOpacity
                  key={snap.id}
                  style={[styles.snapItem, { borderRadius: theme.borderRadius.md }]}
                  onPress={() => handleSnapPress(snap.id, snap.isFeatured || false)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: snap.uri }} style={styles.snapImage} />
                  {snap.isFeatured && (
                    <View style={[styles.featuredBadge, { backgroundColor: theme.colors.accent }]}>
                      <Ionicons name="star" size={12} color={theme.isDark ? '#000' : '#fff'} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Run Journals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Journals</Text>
            <TouchableOpacity onPress={() => router.push(`/run/journal/new?runId=${id}`)}>
              <Ionicons name="add-circle" size={28} color={theme.colors.accent} />
            </TouchableOpacity>
          </View>
          {journals.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: theme.colors.textPrimary }]}>No journals yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Tap + to add your thoughts about this run</Text>
            </Card>
          ) : (
            journals.map((journal) => {
              const journalDate = journal.createdAt instanceof Date
                ? journal.createdAt
                : new Date(journal.createdAt);

              return (
                <TouchableOpacity
                  key={journal.id}
                  onPress={() => router.push(`/run/journal/${journal.id}?runId=${id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.journalCard}>
                    <Text style={[styles.journalContent, { color: theme.colors.textPrimary }]} numberOfLines={3}>
                      {journal.content}
                    </Text>
                    <Text style={[styles.journalDate, { color: theme.colors.textSecondary }]}>
                      {journalDate.toLocaleString()}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Camera modal */}
      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCaptureSnap}
      />
    </SafeAreaView>
  );
}

const StatItem: React.FC<{ icon: any; label: string; value: string; theme: any }> = ({
  icon,
  label,
  value,
  theme,
}) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color={theme.colors.accent} />
    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
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
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  trailName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 15,
  },
  insightCard: {
    marginBottom: 24,
    padding: 16,
  },
  statsCard: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },

  // Snaps grid
  snapsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  snapItem: {
    width: SNAP_SIZE,
    height: SNAP_SIZE,
    margin: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  snapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  journalCard: {
    marginBottom: 16,
  },
  journalContent: {
    fontSize: 15,
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 11,
  },
  errorText: {
    fontSize: 17,
  },
});
