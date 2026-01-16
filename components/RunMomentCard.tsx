import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { runnerTheme } from '../constants/theme';
import { Card } from './ui/card';
import { formatDistance, formatDuration, formatPace } from '../lib/location';
import type { RunMoment } from '../lib/firestore';

interface RunMomentCardProps {
  runMoment: RunMoment;
}

export const RunMomentCard: React.FC<RunMomentCardProps> = ({ runMoment }) => {
  const handlePress = () => {
    router.push(`/run/${runMoment.id}`);
  };

  const date = runMoment.createdAt?.toDate?.() || new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.trailName}>{runMoment.trailName}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={styles.stats}>
          <StatItem label="Distance" value={`${formatDistance(runMoment.distance)} km`} />
          <StatItem label="Duration" value={formatDuration(runMoment.duration)} />
          <StatItem label="Avg Pace" value={`${formatPace(runMoment.avgPace)}/km`} />
        </View>

        {runMoment.status !== 'completed' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {runMoment.status === 'active' ? 'In Progress' : 'Paused'}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: runnerTheme.spacing.md,
  },
  header: {
    marginBottom: runnerTheme.spacing.md,
  },
  trailName: {
    fontSize: runnerTheme.fontSize.lg,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
    marginBottom: runnerTheme.spacing.xs,
  },
  date: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: runnerTheme.fontSize.xs,
    color: runnerTheme.colors.textSecondary,
    marginBottom: runnerTheme.spacing.xs,
  },
  statValue: {
    fontSize: runnerTheme.fontSize.md,
    fontWeight: '600',
    color: runnerTheme.colors.textPrimary,
  },
  statusBadge: {
    marginTop: runnerTheme.spacing.md,
    paddingVertical: runnerTheme.spacing.xs,
    paddingHorizontal: runnerTheme.spacing.sm,
    backgroundColor: runnerTheme.colors.accent,
    borderRadius: runnerTheme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: runnerTheme.fontSize.xs,
    fontWeight: '600',
    color: runnerTheme.colors.background,
  },
});
