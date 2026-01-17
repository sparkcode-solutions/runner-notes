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
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useRunMoment, useJournals, useRunSnaps } from '@/lib/hooks';
import { formatDistance, formatDuration, formatPace } from '@/lib/location';
import { Card } from '@/components/ui/card';
import { CameraCapture } from '@/components/CameraCapture';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAP_SIZE = (SCREEN_WIDTH - 48 - 16) / 3; // 3 columns with spacing

export default function RunMomentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { runMoment, loading } = useRunMoment({ 
    userId: user?.id ?? null, 
    runMomentId: id ?? null 
  });
  const { journals } = useJournals({ runMomentId: id ?? null });
  const { snaps, featuredSnap, addSnap, deleteSnap, setFeatured } = useRunSnaps({ 
    runMomentId: id ?? null 
  });
  
  const [showCamera, setShowCamera] = useState(false);

  const handleCaptureSnap = async (uri: string, caption?: string, fromGallery?: boolean) => {
    try {
      await addSnap(uri, caption, fromGallery);
    } catch (error) {
      console.error('Error saving snap:', error);
      Alert.alert('Error', 'Failed to save snap');
    }
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

  const date = runMoment.createdAt instanceof Date 
    ? runMoment.createdAt 
    : new Date(runMoment.createdAt);
  
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

        {/* Run Snaps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Run Snaps</Text>
            <TouchableOpacity onPress={() => setShowCamera(true)}>
              <Ionicons name="add-circle" size={28} color={runnerTheme.colors.accent} />
            </TouchableOpacity>
          </View>
          
          {snaps.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="camera-outline" size={40} color={runnerTheme.colors.textMuted} />
              <Text style={styles.emptyText}>No snaps yet</Text>
              <Text style={styles.emptySubtext}>Tap + to capture moments from your run</Text>
            </Card>
          ) : (
            <View style={styles.snapsGrid}>
              {snaps.map((snap) => (
                <TouchableOpacity
                  key={snap.id}
                  style={styles.snapItem}
                  onPress={() => handleSnapPress(snap.id, snap.isFeatured || false)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: snap.uri }} style={styles.snapImage} />
                  {snap.isFeatured && (
                    <View style={styles.featuredBadge}>
                      <Ionicons name="star" size={12} color="#fff" />
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
                    <Text style={styles.journalContent} numberOfLines={3}>
                      {journal.content}
                    </Text>
                    <Text style={styles.journalDate}>
                      {journalDate.toLocaleString()}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
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

      {/* Camera modal */}
      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCaptureSnap}
      />
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
    marginTop: runnerTheme.spacing.sm,
    marginBottom: runnerTheme.spacing.xs,
  },
  emptySubtext: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
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
    borderRadius: runnerTheme.borderRadius.md,
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
    backgroundColor: runnerTheme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
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
