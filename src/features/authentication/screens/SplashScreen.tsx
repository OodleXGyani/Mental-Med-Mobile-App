import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  StatusBar,
  Image,
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

// Logo dimensions
const LOGO_WIDTH = 150;
const LOGO_HEIGHT = 55;

// The pixel X-coordinate where the image splits between "Rack" and "Rx"
// This might need a tiny tweak depending on the exact image padding, but ~60% is a good guess
const CROP_X = 98;
const RX_WIDTH = LOGO_WIDTH - CROP_X;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Rx badge half: pops in
  const rxScale = useRef(new Animated.Value(0.5)).current;
  const rxOpacity = useRef(new Animated.Value(0)).current;

  // Rack half: starts behind Rx (translateX = CROP_X) and slides left to 0
  const rackTranslateX = useRef(new Animated.Value(CROP_X)).current;
  const rackOpacity = useRef(new Animated.Value(0)).current;

  // Tagline
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Exit
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Step 1 — Rx side pops in
      Animated.parallel([
        Animated.spring(rxScale, {
          toValue: 1,
          tension: 110,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rxOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(300),

      // Step 2 — Rack side slides out (emerging from the crop edge)
      Animated.parallel([
        Animated.timing(rackTranslateX, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rackOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      // Step 3 — Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 340,
        delay: 60,
        useNativeDriver: true,
      }),

      Animated.delay(900),

      // Step 4 — Fade out
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [
    containerOpacity,
    onFinish,
    rackOpacity,
    rackTranslateX,
    rxOpacity,
    rxScale,
    taglineOpacity,
  ]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Center Wrapper */}
      <View style={styles.logoRow}>
        {/* RACK SIDE (Cropped Left Half) */}
        {/* Container is fixed in place, clipping anything outside it */}
        <View style={[styles.cropContainer, styles.rackCropContainer]}>
          {/* Image translates *inside* the container, sliding into view from the right edge */}
          <Animated.Image
            source={require('../../../assets/images/Medslogo.png')}
            style={[
              styles.fullImage,
              {
                opacity: rackOpacity,
                transform: [{ translateX: rackTranslateX }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* RX SIDE (Cropped Right Half) */}
        <Animated.View
          style={[
            styles.cropContainer,
            styles.rxCropContainer,
            {
              opacity: rxOpacity,
              transform: [{ scale: rxScale }],
            },
          ]}
        >
          {/* Shift image left so we only see the right half inside this container */}
          <Image
            source={require('../../../assets/images/Medslogo.png')}
            style={[styles.fullImage, styles.rxImage]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Meds15 Staff Portal
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  cropContainer: {
    height: LOGO_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  rackCropContainer: {
    width: CROP_X,
  },
  rxCropContainer: {
    width: RX_WIDTH,
    zIndex: 2,
  },
  rxImage: {
    left: -CROP_X,
  },
  fullImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    position: 'absolute',
  },
  tagline: {
    marginTop: 20,
    fontSize: 12,
    fontWeight: '500',
    color: '#AAAABB',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});
