/**
 * FACTS - Splash Screen
 * Premium animated launch screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const dotLeftX = useSharedValue(-60);
  const dotRightX = useSharedValue(60);
  const dotsOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Fade in dots
    dotsOpacity.value = withTiming(1, { duration: 400 });
    
    // Animate dots coming together
    dotLeftX.value = withDelay(
      200,
      withSpring(-6, { damping: 12, stiffness: 100 })
    );
    dotRightX.value = withDelay(
      200,
      withSpring(6, { damping: 12, stiffness: 100 })
    );
    
    // Show FACTS text
    logoOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(700, withSpring(1, { damping: 12 }));
    
    // Fade out and finish
    containerOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, []);

  const dotLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dotLeftX.value }],
    opacity: dotsOpacity.value,
  }));

  const dotRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dotRightX.value }],
    opacity: dotsOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#FDF6F4', '#F8E8E5', '#F0D9D5', '#E8CAC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Animated Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dotLeftStyle]} />
          <Animated.View style={[styles.dot, dotRightStyle]} />
        </View>

        {/* Logo Text */}
        <Animated.View style={logoStyle}>
          <Text style={styles.logoText}>FACTS</Text>
          <Text style={styles.tagline}>Vérifiez tout. Instantanément.</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(26, 26, 26, 0.6)',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
