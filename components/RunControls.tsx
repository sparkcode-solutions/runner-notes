import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { runnerTheme } from '../constants/theme';

interface RunControlsProps {
  status: 'idle' | 'active' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const RunControls: React.FC<RunControlsProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color={runnerTheme.colors.accent} />
          <Text style={styles.startText}>Start Run</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={onStop}
          activeOpacity={0.8}
        >
          <Ionicons name="stop" size={28} color={runnerTheme.colors.error} />
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pauseButton}
          onPress={status === 'active' ? onPause : onResume}
          activeOpacity={0.8}
        >
          <Ionicons
            name={status === 'active' ? 'pause' : 'play'}
            size={40}
            color={runnerTheme.colors.background}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.statusText}>
        {status === 'active' ? 'Running' : 'Paused'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: runnerTheme.colors.surface,
    width: 240,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: runnerTheme.colors.accent,
  },
  startText: {
    fontSize: 18,
    fontWeight: '600',
    color: runnerTheme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: runnerTheme.spacing.xl,
  },
  pauseButton: {
    backgroundColor: runnerTheme.colors.accent,
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: runnerTheme.colors.surface,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: runnerTheme.colors.error,
  },
  stopText: {
    fontSize: runnerTheme.fontSize.sm,
    fontWeight: '600',
    color: runnerTheme.colors.error,
    marginTop: runnerTheme.spacing.xs,
  },
  statusText: {
    fontSize: runnerTheme.fontSize.md,
    fontWeight: '600',
    color: runnerTheme.colors.accent,
    marginTop: runnerTheme.spacing.lg,
  },
});
