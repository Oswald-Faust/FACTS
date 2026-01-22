import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface SoftBackgroundProps {
  isDark?: boolean;
}

export default function SoftBackground({ isDark = false }: SoftBackgroundProps) {
  // Animation values for floating orbs
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  useEffect(() => {
    // Random gentle movement
    const config = { duration: 10000, easing: Easing.inOut(Easing.quad) };
    
    orb1X.value = withRepeat(withSequence(withTiming(50, config), withTiming(-50, config)), -1, true);
    orb1Y.value = withRepeat(withSequence(withTiming(-30, config), withTiming(30, config)), -1, true);
    
    orb2X.value = withRepeat(withSequence(withTiming(-40, config), withTiming(40, config)), -1, true);
    orb2Y.value = withRepeat(withSequence(withTiming(40, config), withTiming(-40, config)), -1, true);
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  // Colors based on theme
  const bgColors = isDark 
    ? ['#0F0F1A', '#1A1A2E'] 
    : ['#FDFBF7', '#F4F1EA']; // Warmer, softer light background

  const orb1Color = isDark 
    ? 'rgba(88, 86, 214, 0.3)' // Deep purple
    : 'rgba(255, 182, 193, 0.4)'; // Soft pink

  const orb2Color = isDark 
    ? 'rgba(0, 122, 255, 0.2)' // Blue
    : 'rgba(173, 216, 230, 0.4)'; // Soft blue

  return (
    <View style={StyleSheet.absoluteFill}>
       {/* Base Layer */}
       <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Orbs for "Aurora" effect */}
      <Animated.View style={[styles.orb, { backgroundColor: orb1Color, top: -100, left: -50 }, orb1Style]} />
      <Animated.View style={[styles.orb, { backgroundColor: orb2Color, bottom: -100, right: -50 }, orb2Style]} />

      {/* Glass Overlay to blur everything together */}
      <BlurView intensity={60} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.6,
  },
});
