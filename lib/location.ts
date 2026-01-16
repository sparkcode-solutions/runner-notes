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

export const startLocationTracking = async (
  callback: (location: LocationCoords) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return null;
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
