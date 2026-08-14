import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import { useAppSelector } from '../../app/hooks';
import { authService } from '../../features/authentication/services/authService';

export const useFCM = () => {
  const { isAuthenticated, session } = useAppSelector(state => state.auth);

  useEffect(() => {
    const messaging = getMessaging(getApp());

    const setupFCM = async () => {
      try {
        // 1. Request Notification Permissions (primarily for iOS)
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('FCM Notification permission granted.');

          // 2. Register device for remote messages (Required for iOS, safe for Android)
          try {
            if (!isDeviceRegisteredForRemoteMessages(messaging)) {
              await registerDeviceForRemoteMessages(messaging);
            }

            // 3. Fetch the registration token
            const token = await getToken(messaging);
            console.log('FCM Token retrieved:', token);

            // 4. Upload token to Python server if user is logged in
            if (isAuthenticated && session?.email && token) {
              const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
              const success = await authService.uploadFCMToken(session.email, token, deviceType);
              console.log('FCM Token sync status with backend:', success ? 'Success' : 'Failed');
            }
          } catch (fcmError) {
            console.log('FCM Registration/Token Warning (Safe to ignore on simulator):', fcmError);
          }
        } else {
          console.log('FCM Notification permission denied.');
        }
      } catch (error) {
        console.error('Error during FCM setup:', error);
      }
    };

    setupFCM();

    // 4. Handle Foreground Messages (app is active and open)
    const unsubscribeForeground = onMessage(messaging, async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || ''
      );
    });

    // 5. Handle App opening from a notification in Background state
    const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging, remoteMessage => {
      console.log('App opened from background by notification:', remoteMessage);
    });

    // 6. Handle App opening from a notification in Terminated state
    getInitialNotification(messaging).then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from terminated state by notification:', remoteMessage);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeNotificationOpened();
    };
  }, [isAuthenticated, session]);
};
