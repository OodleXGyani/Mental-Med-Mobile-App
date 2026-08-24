import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type Coordinates = { latitude: number; longitude: number };

/**
 * Requests the device's real current GPS position.
 *
 * This used to check for `globalThis.geolocation` and silently fall back
 * to a hardcoded coordinate (28.6139, 77.209 -- New Delhi) whenever that
 * was missing. Bare React Native has no such global -- no geolocation
 * package was ever installed -- so that check failed 100% of the time,
 * meaning every delivery status update and every attendance check-in was
 * silently recording the same fake location, permanently, regardless of
 * where the device actually was. Both the Android manifest
 * (ACCESS_FINE_LOCATION/ACCESS_COARSE_LOCATION) and iOS Info.plist
 * (NSLocationWhenInUseUsageDescription) already declare the permission,
 * so the native scaffolding was in place -- the JS side just never
 * called a real geolocation API. This throws instead of faking a
 * position on failure: a location-tagged audit trail that's sometimes
 * honestly unavailable is far better than one that's silently wrong.
 */
export const requestCurrentCoordinates = async (): Promise<Coordinates> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'We need your location to record this action with real coordinates.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Location permission denied.');
    }
  }

  return await new Promise<Coordinates>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        reject(
          new Error(
            error?.message ||
              'Unable to get your current location. Check that location services are enabled.',
          ),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      },
    );
  });
};
