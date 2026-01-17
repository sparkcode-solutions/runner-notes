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
import { CameraCapture } from '@/components/CameraCapture';
import { Ionicons } from '@expo/vector-icons';
import {
  requestLocationPermissions,
  startLocationTracking,
  getCurrentLocation,
  calculateDistance,
  calculatePace,
  type LocationCoords,
} from '@/lib/location';
import { createRunMomentRecord, completeRunMomentRecord } from '@/lib/hooks';
import { useRunSnaps } from '@/lib/hooks';
import type { LocationSubscription } from 'expo-location';

type RunStatus = 'idle' | 'active' | 'paused';

interface PacePoint {
  timestamp: number;
  pace: number;
  lat: number;
  lng: number;
}

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
  
  const [showCamera, setShowCamera] = useState(false);
  
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);
  const lastLocationRef = useRef<LocationCoords | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const totalDistanceRef = useRef<number>(0); // Track cumulative distance in ref
  const currentDurationRef = useRef<number>(0); // Track current duration in ref

  // Run snaps hook
  const { addSnap, snaps } = useRunSnaps({ runMomentId });

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

    // If this is the first location, just store it and return
    if (!lastLocationRef.current) {
      lastLocationRef.current = location;
      return;
    }

    // Calculate distance delta from last location
    const distanceDelta = calculateDistance(
      lastLocationRef.current.latitude,
      lastLocationRef.current.longitude,
      location.latitude,
      location.longitude
    );

    // Only add distance if it's significant (filter out GPS noise)
    // GPS can have small errors, so ignore very small movements
    if (distanceDelta > 1) { // Only count movements > 1 meter
      // Update cumulative distance using ref to avoid stale closure
      totalDistanceRef.current += distanceDelta;
      const newDistance = totalDistanceRef.current;
      setDistance(newDistance);

      // Calculate pace using duration from ref (always current)
      const currentDuration = currentDurationRef.current;
      if (newDistance > 0 && currentDuration > 0) {
        const currentPace = calculatePace(newDistance, currentDuration);
        setPace(currentPace);

        const pacePoint: PacePoint = {
          timestamp: location.timestamp,
          pace: currentPace,
          lat: location.latitude,
          lng: location.longitude,
        };
        setPaceHistory((prev) => [...prev, pacePoint]);
      }
    }

    // Update last location
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
      // Reset distance tracking
      totalDistanceRef.current = 0;
      currentDurationRef.current = 0;
      setDistance(0);
      setDuration(0);
      setPace(0);
      setPaceHistory([]);
      lastLocationRef.current = null;
      pausedDurationRef.current = 0;

      // Create run moment in local database
      const momentId = await createRunMomentRecord(user.id, selectedTrailId, selectedTrailName);
      setRunMomentId(momentId);

      // Get initial location first
      const initialLocation = await getCurrentLocation();
      if (initialLocation) {
        lastLocationRef.current = initialLocation;
      }

      // Start location tracking
      const subscription = await startLocationTracking(handleLocationUpdate);
      locationSubscriptionRef.current = subscription;

      // Start timer
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
          currentDurationRef.current = elapsed; // Update ref
          setDuration(elapsed);
          
          // Recalculate pace with updated duration
          if (totalDistanceRef.current > 0) {
            const currentPace = calculatePace(totalDistanceRef.current, elapsed);
            setPace(currentPace);
          }
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
      const pausedTime = Math.floor((Date.now() - startTimeRef.current) / 1000) - currentDurationRef.current;
      pausedDurationRef.current += pausedTime;
    }

    // Restart timer
    timerIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
        currentDurationRef.current = elapsed; // Update ref
        setDuration(elapsed);
        
        // Recalculate pace with updated duration
        if (totalDistanceRef.current > 0) {
          const currentPace = calculatePace(totalDistanceRef.current, elapsed);
          setPace(currentPace);
        }
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

            // Use ref value for final distance to ensure accuracy
            const finalDistance = totalDistanceRef.current;
            const avgPace = calculatePace(finalDistance, duration);

            try {
              await completeRunMomentRecord(runMomentId, {
                duration,
                distance: finalDistance,
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

  const handleCaptureSnap = async (uri: string, caption?: string, fromGallery?: boolean) => {
    try {
      await addSnap(uri, caption, fromGallery);
    } catch (error) {
      console.error('Error saving snap:', error);
      Alert.alert('Error', 'Failed to save snap');
    }
  };

  const isRunning = status === 'active' || status === 'paused';

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

        {/* Snap count indicator */}
        {isRunning && snaps.length > 0 && (
          <View style={styles.snapIndicator}>
            <Ionicons name="camera" size={16} color={runnerTheme.colors.accent} />
            <Text style={styles.snapCount}>{snaps.length} snap{snaps.length > 1 ? 's' : ''}</Text>
          </View>
        )}

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

      {/* Floating camera button - only show during active run */}
      {isRunning && (
        <TouchableOpacity 
          style={styles.cameraFab} 
          onPress={() => setShowCamera(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Camera modal */}
      <CameraCapture
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCaptureSnap}
      />
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
  snapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: runnerTheme.spacing.md,
  },
  snapCount: {
    fontSize: runnerTheme.fontSize.sm,
    color: runnerTheme.colors.accent,
    marginLeft: runnerTheme.spacing.xs,
  },
  cameraFab: {
    position: 'absolute',
    bottom: 120,
    left: runnerTheme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: runnerTheme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...runnerTheme.shadow.lg,
  },
});
