import { CameraCapture } from '@/components/CameraCapture';
import { PaceDisplay } from '@/components/PaceDisplay';
import { RunControls } from '@/components/RunControls';
import { TrailRecommender } from '@/components/TrailRecommender';
import { TrailSelector } from '@/components/TrailSelector';
import { runnerTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useCoach } from '@/lib/coach-context';
import { completeRunMomentRecord, createRunMomentRecord, useRunMoments, useRunSnaps } from '@/lib/hooks';
import {
  getCurrentLocation,
  requestLocationPermissions,
  reverseGeocode,
  startLocationTracking,
  stopLocationTracking
} from '@/lib/location';
import { ReflectionEngine } from '@/lib/reflection';
import { useRun } from '@/lib/run-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

export default function CreateRunScreen() {
  const params = useLocalSearchParams();
  const autoStart = params.autoStart === 'true';
  const { user } = useAuth();
  const { greeting } = useCoach();

  // Use Global Run Context
  const {
    status,
    distance,
    duration,
    pace,
    paceHistory,
    runMomentId,
    trailName: contextTrailName,
    trailId: contextTrailId,
    startRun,
    stopRun,
    pauseRun,
    resumeRun,
    isRestored
  } = useRun();

  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(contextTrailId);
  const [selectedTrailName, setSelectedTrailName] = useState<string | null>(contextTrailName);

  // Keep local state for trail selection only if idle
  useEffect(() => {
    if (contextTrailId) setSelectedTrailId(contextTrailId);
    if (contextTrailName) setSelectedTrailName(contextTrailName);
  }, [contextTrailId, contextTrailName]);

  const [showCamera, setShowCamera] = useState(false);
  const slowPaceCountRef = useRef<number>(0);

  // Fetch recent history for AI recommendation
  const { runMoments: history } = useRunMoments({ userId: user.id });
  const [recommendation, setRecommendation] = useState<{
    type: 'recovery' | 'steady' | 'push';
    text: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (history) {
      const loadSuggestion = async () => {
        const suggestion = await ReflectionEngine.getRunSuggestion(history);
        setRecommendation(suggestion);
      };
      loadSuggestion();
    }
  }, [history]);

  // Run snaps hook
  const { addSnap, snaps } = useRunSnaps({ runMomentId });

  // Handle Location Updates for UI interactions (Auto-Walk detection)
  // Distance tracking is now in Context, but we might want to listen for specific events here if needed.
  // For now, let's just rely on Context for data.
  // BUT: Auto-Walk detection logic was in create.tsx. We should keep it or move it.
  // Moving it to create.tsx: triggering Alert needs UI.
  // We can monitor `pace` from context.
  useEffect(() => {
    if (status === 'active' && pace > 10) {
      slowPaceCountRef.current += 1;
      if (slowPaceCountRef.current >= 5) {
        slowPaceCountRef.current = 0;
        Alert.alert(
          'Pace Detected',
          'You seem to be moving at a walking pace. Would you like to switch mode?',
          [
            { text: 'Keep Running', style: 'cancel' },
            {
              text: 'Switch to Walk', onPress: () => {
                // Update context trail name?
                // We need a way to update context trail name.
                // For now, ignore or implement `updateRunDetails`.
              }
            }
          ]
        );
      }
    } else {
      slowPaceCountRef.current = 0;
    }
  }, [status, pace]);

  const handleStart = async () => {
    // 1. Permissions
    const hasPermissions = await requestLocationPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Required', 'Location is required to track run.');
      return;
    }

    let tName = selectedTrailName;
    let tId = selectedTrailId;

    if (!tName) {
      const loc = await getCurrentLocation();
      if (loc) {
        const name = await reverseGeocode(loc.latitude, loc.longitude);
        tName = name ? `Run in ${name}` : `Run - ${new Date().toLocaleDateString()}`;
        tId = 'auto-location';
      } else {
        tName = `Run - ${new Date().toLocaleDateString()}`;
        tId = 'auto-unknown';
      }
      setSelectedTrailName(tName);
      setSelectedTrailId(tId);
    }

    try {
      // Create DB record
      const momentId = await createRunMomentRecord(user.id, tId!, tName!);

      // Start Location Service
      await startLocationTracking();

      // Start Global Run
      startRun(tId!, tName!, momentId);

    } catch (e) {
      console.error('Error starting run', e);
      Alert.alert('Error', 'Failed to start run');
    }
  };

  // Auto-start
  useEffect(() => {
    if (autoStart && status === 'idle' && isRestored) {
      handleStart();
    }
  }, [autoStart, status, isRestored]);

  const handleStop = () => {
    Alert.alert(
      'Complete Run',
      'Finish this run?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            if (!runMomentId) return;
            // Stop location
            await stopLocationTracking();

            // Save to DB
            // We use global stats
            try {
              await completeRunMomentRecord(runMomentId, {
                duration,
                distance,
                avgPace: pace, // or calculate avg from duration/distance
                paceHistory
              });
              stopRun(); // Reset global state
              router.replace(`/run/${runMomentId}`);
            } catch (e) {
              console.error('Error saving', e);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    if (status !== 'idle') {
      // Keep run running in background! 
      // Just navigate back. User can return later.
      router.back();
    } else {
      router.back();
    }
  };

  const handleCaptureSnap = async (uri: string, caption?: string, fromGallery?: boolean) => {
    await addSnap(uri, caption, fromGallery);
  };

  const isRunning = status === 'active' || status === 'paused';

  // Get last location for map from history (latest point)
  const lastPoint = paceHistory.length > 0 ? paceHistory[paceHistory.length - 1] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color={runnerTheme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>{status === 'idle' ? 'New Run' : 'Current Run'}</Text>
          <Text style={styles.subtitle}>{greeting}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {status === 'idle' && recommendation && (
          <View style={styles.section}>
            <TrailRecommender suggestion={recommendation} />
          </View>
        )}

        {/* Map View */}
        {isRunning && lastPoint && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              region={{
                latitude: lastPoint.lat,
                longitude: lastPoint.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              showsUserLocation
              followsUserLocation
            >
              <Polyline
                coordinates={paceHistory.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={runnerTheme.colors.accent}
                strokeWidth={4}
              />
            </MapView>
          </View>
        )}

        {status === 'idle' && (
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
        )}

        <View style={styles.section}>
          <PaceDisplay distance={distance} duration={duration} pace={pace} />
        </View>

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
            onPause={pauseRun}
            onResume={resumeRun}
            onStop={handleStop}
          />
        </View>
      </ScrollView>

      {isRunning && (
        <TouchableOpacity
          style={styles.cameraFab}
          onPress={() => setShowCamera(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      )}

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
  subtitle: {
    fontSize: 12,
    color: runnerTheme.colors.textSecondary,
    marginTop: 2,
    maxWidth: 200,
    textAlign: 'center',
  },
  content: {
    padding: runnerTheme.spacing.lg,
    paddingBottom: 100,
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
    bottom: 40,
    left: runnerTheme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: runnerTheme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...runnerTheme.shadow.lg,
  },
  mapContainer: {
    height: 300,
    borderRadius: runnerTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: runnerTheme.spacing.xl,
    backgroundColor: '#333',
  },
  map: {
    flex: 1,
  },
});
