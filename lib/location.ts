import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return false;
  }

  // Request background permissions for tracking during active run
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  return backgroundStatus === 'granted' || foregroundStatus === 'granted';
};

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

import * as TaskManager from 'expo-task-manager';
import { DeviceEventEmitter } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    // Emit the latest location to the UI
    if (locations && locations.length > 0) {
      const location = locations[locations.length - 1]; // Get the latest
      
      console.log(`[BackgroundLocation] New update: ${location.timestamp} | Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude} | Acc: ${location.coords.accuracy}`);

      DeviceEventEmitter.emit('onLocationUpdate', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy, // Pass accuracy for filtering
      });
    }
  }
});

export const startLocationTracking = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Background permission not granted');
      // Fallback to foreground permission check or return false
      // Assuming requestLocationPermissions was called before this
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 2,
      showsBackgroundLocationIndicator: true, // Show blue bar on iOS
      foregroundService: {
        notificationTitle: "Run Active",
        notificationBody: "Tracking your run location...",
      },
    });
    return true;
  } catch (error) {
    console.error('Error starting background location tracking:', error);
    return false;
  }
};

export const stopLocationTracking = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.error('Error stopping location tracking:', error);
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Haversine formula to calculate distance in meters
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculatePace = (distanceMeters: number, durationSeconds: number): number => {
  // Returns pace in min/km
  if (distanceMeters === 0) return 0;
  
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;
  
  return durationMinutes / distanceKm;
};

export const formatPace = (pace: number): string => {
  // Format pace as MM:SS
  if (!pace || pace === Infinity || isNaN(pace)) return '--:--';
  
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDistance = (meters: number): string => {
  // Format distance as X.XX km
  const km = meters / 1000;
  return km.toFixed(2);
};

export const formatDuration = (seconds: number): string => {
  // Format duration as HH:MM:SS
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
