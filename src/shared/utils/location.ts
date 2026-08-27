import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type Coordinates = { latitude: number; longitude: number };

try {
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
  });
} catch {
  // Ignore configuration errors if native module is not ready
}

const checkAndRequestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return new Promise<boolean>(resolve => {
      try {
        Geolocation.requestAuthorization(
          () => resolve(true),
          error => {
            console.warn('iOS location authorization denied:', error);
            resolve(false);
          },
        );
      } catch {
        resolve(true);
      }
    });
  }

  try {
    const hasFineLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const hasCoarseLocation = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );

    if (hasFineLocation || hasCoarseLocation) {
      return true;
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineGranted =
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted =
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED;

    return fineGranted || coarseGranted;
  } catch (error) {
    console.warn('Error checking/requesting location permission:', error);
    return false;
  }
};

const getPositionPromise = (highAccuracy: boolean, timeoutMs: number): Promise<Coordinates> => {
  return new Promise<Coordinates>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        if (position && position.coords) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } else {
          reject(new Error('No coordinate data returned.'));
        }
      },
      error => {
        reject(error);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: highAccuracy ? 10000 : 60000,
      },
    );
  });
};

/**
 * Requests the device's current GPS/network location coordinates.
 *
 * Implements a two-tiered fallback:
 * 1. Requests high-accuracy GPS coordinates first.
 * 2. If GPS times out or fails (e.g. indoors, slow satellite lock), falls back
 *    to network/cell/Wi-Fi positioning (enableHighAccuracy: false).
 * 3. Enforces an overall timeout to prevent hanging UI states.
 */
export const requestCurrentCoordinates = async (): Promise<Coordinates> => {
  const hasPermission = await checkAndRequestLocationPermission();

  if (!hasPermission) {
    throw new Error(
      'Location permission denied. Please allow location access in your device settings to check in.',
    );
  }

  // Fallback safety timeout (15s total)
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<Coordinates>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error(
          'Location request timed out. Please ensure GPS/Location is enabled in device settings and try again.',
        ),
      );
    }, 15000);
  });

  const locationFetch = async (): Promise<Coordinates> => {
    try {
      // 1. Try high accuracy (GPS) first with 6s timeout
      return await getPositionPromise(true, 6000);
    } catch (highAccuracyError) {
      console.log(
        'High accuracy GPS attempt failed or timed out, trying low accuracy / network provider...',
        highAccuracyError,
      );

      // 2. Fall back to low accuracy (network/Wi-Fi provider) with 6s timeout
      try {
        return await getPositionPromise(false, 6000);
      } catch (lowAccuracyError: any) {
        const errorMsg =
          lowAccuracyError?.message ||
          'Unable to determine device location. Please ensure location services are enabled.';
        throw new Error(errorMsg);
      }
    }
  };

  try {
    return await Promise.race([locationFetch(), timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

