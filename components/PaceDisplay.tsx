import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { runnerTheme } from '../constants/theme';
import { formatDistance, formatDuration, formatPace } from '../lib/location';

interface PaceDisplayProps {
  distance: number; // meters
  duration: number; // seconds
  pace: number; // min/km
}

export const PaceDisplay: React.FC<PaceDisplayProps> = ({
  distance,
  duration,
  pace,
}) => {
  return (
    <View style={styles.container}>
      <MetricItem
        label="Distance"
        value={formatDistance(distance)}
        unit="km"
        large
      />
      <View style={styles.row}>
        <MetricItem
          label="Duration"
          value={formatDuration(duration)}
          unit=""
        />
        <MetricItem
          label="Pace"
          value={formatPace(pace)}
          unit="/km"
        />
      </View>
    </View>
  );
};

const MetricItem: React.FC<{
  label: string;
  value: string;
  unit: string;
  large?: boolean;
}> = ({ label, value, unit, large = false }) => (
  <View style={[styles.metric, large && styles.metricLarge]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
      <Text style={[styles.value, large && styles.valueLarge]}>
        {value}
      </Text>
      {unit && <Text style={styles.unit}>{unit}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: runnerTheme.colors.surface,
    borderRadius: runnerTheme.borderRadius.lg,
    padding: runnerTheme.spacing.lg,
    borderWidth: 1,
    borderColor: runnerTheme.colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: runnerTheme.spacing.lg,
  },
  metric: {
    flex: 1,
  },
  metricLarge: {
    alignItems: 'center',
    marginBottom: runnerTheme.spacing.md,
  },
  label: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.textSecondary,
    marginBottom: runnerTheme.spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: runnerTheme.fontSize.xl,
    fontWeight: '700',
    color: runnerTheme.colors.textPrimary,
  },
  valueLarge: {
    fontSize: runnerTheme.fontSize.xxl * 1.5,
  },
  unit: {
    fontSize: runnerTheme.fontSize.md,
    color: runnerTheme.colors.textSecondary,
    marginLeft: runnerTheme.spacing.xs,
  },
});
