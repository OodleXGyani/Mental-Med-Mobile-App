import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useAppSelector } from '../../app/hooks';
import { authService } from '../../features/authentication/services/authService';

export const useFCM = () => {
  const { isAuthenticated, session } = useAppSelector(state => state.auth);

  useEffect(() => {
    const setupFCM = async () => {
      try {
        // 1. Request Notification Permissions (primarily for iOS)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('FCM Notification permission granted.');
          
          // 2. Register device for remote messages (Required for iOS, safe for Android)
          try {
            await messaging().registerDeviceForRemoteMessages();
          } catch (regError) {
            console.log('FCM Registration Warning (Safe to ignore):', regError);
          }

          // 3. Fetch the registration token
          const token = await messaging().getToken();
          console.log('FCM Token retrieved:', token);

          // 3. Upload token to Python server if user is logged in
          if (isAuthenticated && session?.email && token) {
            const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
            const success = await authService.uploadFCMToken(session.email, token, deviceType);
            console.log('FCM Token sync status with backend:', success ? 'Success' : 'Failed');
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
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || ''
      );
    });

    // 5. Handle App opening from a notification in Background state
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from background by notification:', remoteMessage);
    });

    // 6. Handle App opening from a notification in Terminated state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
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
