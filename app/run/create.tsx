import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { TrailSelector } from '@/components/TrailSelector';
import { PaceDisplay } from '@/components/PaceDisplay';
import { RunControls } from '@/components/RunControls';
import { Ionicons } from '@expo/vector-icons';
import {
  requestLocationPermissions,
  startLocationTracking,
  calculateDistance,
  calculatePace,
  type LocationCoords,
} from '@/lib/location';
import { createRunMoment, completeRunMoment, type PacePoint } from '@/lib/firestore';
import type { LocationSubscription } from 'expo-location';

type RunStatus = 'idle' | 'active' | 'paused';

export default function CreateRunScreen() {
  const { user } = useAuth();
  const [status, setStatus] = useState<RunStatus>('idle');
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [selectedTrailName, setSelectedTrailName] = useState<string | null>(null);
  
  const [distance, setDistance] = useState(0); // meters
  const [duration, setDuration] = useState(0); // seconds
  const [pace, setPace] = useState(0); // min/km
  
  const [runMomentId, setRunMomentId] = useState<string | null>(null);
  const [paceHistory, setPaceHistory] = useState<PacePoint[]>([]);
  
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);
  const lastLocationRef = useRef<LocationCoords | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleLocationUpdate = (location: LocationCoords) => {
    if (status !== 'active') return;

    if (lastLocationRef.current) {
      const distanceDelta = calculateDistance(
        lastLocationRef.current.latitude,
        lastLocationRef.current.longitude,
        location.latitude,
        location.longitude
      );

      const newDistance = distance + distanceDelta;
      setDistance(newDistance);

      const currentPace = calculatePace(newDistance, duration);
      setPace(currentPace);

      const pacePoint: PacePoint = {
        timestamp: location.timestamp,
        pace: currentPace,
        lat: location.latitude,
        lng: location.longitude,
      };
      setPaceHistory((prev) => [...prev, pacePoint]);
    }

    lastLocationRef.current = location;
  };

  const handleStart = async () => {
    if (!selectedTrailId || !selectedTrailName) {
      Alert.alert('Select Trail', 'Please select a trail before starting');
      return;
    }

    if (!user) return;

    // Request location permissions
    const hasPermissions = await requestLocationPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Location Permission',
        'Location permissions are required to track your run'
      );
      return;
    }

    try {
      // Create run moment in Firestore
      const momentId = await createRunMoment(user.uid, selectedTrailId, selectedTrailName);
      setRunMomentId(momentId);

      // Start location tracking
      const subscription = await startLocationTracking(handleLocationUpdate);
      locationSubscriptionRef.current = subscription;

      // Start timer
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
          setDuration(elapsed);
        }
      }, 1000);

      setStatus('active');
    } catch (error) {
      Alert.alert('Error', 'Failed to start run tracking');
      console.error('Error starting run:', error);
    }
  };

  const handlePause = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setStatus('paused');
  };

  const handleResume = () => {
    // Calculate paused duration
    if (startTimeRef.current) {
      const pausedTime = Math.floor((Date.now() - startTimeRef.current) / 1000) - duration;
      pausedDurationRef.current += pausedTime;
    }

    // Restart timer
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
        setDuration(elapsed);
      }
    }, 1000);

    setStatus('active');
  };

  const handleStop = () => {
    Alert.alert(
      'Complete Run',
      'Are you sure you want to complete this run?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            if (!user || !runMomentId) return;

            // Stop tracking
            if (locationSubscriptionRef.current) {
              locationSubscriptionRef.current.remove();
            }
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }

            const avgPace = calculatePace(distance, duration);

            try {
              await completeRunMoment(user.uid, runMomentId, {
                duration,
                distance,
                avgPace,
                paceHistory,
              });

              router.replace(`/run/${runMomentId}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to save run');
              console.error('Error completing run:', error);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (status !== 'idle') {
      Alert.alert(
        'Exit',
        'Are you sure you want to exit? Your run will not be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color={runnerTheme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Run</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TrailSelector
            selectedTrailId={selectedTrailId}
            selectedTrailName={selectedTrailName}
            onSelectTrail={(id, name) => {
              setSelectedTrailId(id);
              setSelectedTrailName(name);
            }}
          />
        </View>

        <View style={styles.section}>
          <PaceDisplay distance={distance} duration={duration} pace={pace} />
        </View>

        <View style={styles.controlsSection}>
          <RunControls
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  controlsSection: {
    marginTop: runnerTheme.spacing.xl,
    alignItems: 'center',
  },
});
