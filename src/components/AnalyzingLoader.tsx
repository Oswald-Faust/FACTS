import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '../constants/theme';
import SoftBackground from './SoftBackground';

interface AnalyzingLoaderProps {
  isDark: boolean;
}

export default function AnalyzingLoader({ isDark }: AnalyzingLoaderProps) {
  const pulse = useSharedValue(1);
  const textOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    
    textOpacity.value = withRepeat(
        withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0.4, { duration: 800 })
        ),
        -1,
        true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.8 / pulse.value,
  }));
  
  const textStyle = useAnimatedStyle(() => ({
      opacity: textOpacity.value
  }));

  return (
    <Animated.View 
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <SoftBackground isDark={isDark} />
      <BlurView intensity={20} style={[StyleSheet.absoluteFill, styles.content]}>
        
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.circle, { borderColor: isDark ? '#FFF' : '#000' }, pulseStyle]} />
          <Animated.View style={[styles.core, { backgroundColor: isDark ? '#FFF' : '#000' }]} />
        </View>

        <Animated.Text style={[styles.text, { color: isDark ? '#FFF' : '#000' }, textStyle]}>
          Analyse en cours...
        </Animated.Text>
        
        <Text style={[styles.subtext, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
           Recherche de sources et vérification des faits
        </Text>

      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    position: 'absolute',
  },
  core: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  text: {
    fontFamily: 'Georgia',
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  subtext: {
    ...Typography.subheadline,
    textAlign: 'center',
  }
});
