import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import CameraKit from 'react-native-camera-kit';

export type CameraPermissionStatus =
  | 'granted'
  | 'denied'
  | 'never_ask_again'
  | 'undetermined';

const getCameraNativeModule = () => {
  return (
    NativeModules.RNCameraKitModule ||
    NativeModules.CameraKit ||
    CameraKit
  );
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      return await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
    }

    const module = getCameraNativeModule();
    if (module?.checkDeviceCameraAuthorizationStatus) {
      const status = await module.checkDeviceCameraAuthorizationStatus();
      // On iOS, status: true / 1 = authorized, -1 = undetermined, false / 0 = denied
      return status === true || status === 1;
    }
    if (module?.requestDeviceCameraAuthorization) {
      const status = await module.requestDeviceCameraAuthorization();
      return status === true || status === 1;
    }
  } catch (error) {
    console.warn('Error checking camera permission:', error);
  }
  return false;
};

export const requestCameraPermission = async (): Promise<CameraPermissionStatus> => {
  try {
    if (Platform.OS === 'android') {
      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message:
            'Mental Med requires camera access to scan medicine barcodes.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );
      if (status === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      }
      if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      return 'denied';
    }

    // iOS
    const module = getCameraNativeModule();
    if (module?.requestDeviceCameraAuthorization) {
      const result = await module.requestDeviceCameraAuthorization();
      if (result === true || result === 1) {
        return 'granted';
      }
      return 'denied';
    }

    if (module?.checkDeviceCameraAuthorizationStatus) {
      const status = await module.checkDeviceCameraAuthorizationStatus();
      if (status === true || status === 1) {
        return 'granted';
      }
      return 'denied';
    }
  } catch (error) {
    console.warn('Error requesting camera permission on iOS:', error);
  }
  return 'denied';
};
