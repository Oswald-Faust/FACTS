/**
 * FACTS - GlassCard Component
 * Premium Glassmorphism Card with blur effect
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, { 
  SlideInUp,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { useTheme } from '../contexts/AppContext';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  animated?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  style,
  animated = true,
  delay = 0,
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const cardStyle: ViewStyle = {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.08)',
    backgroundColor: isDark 
      ? 'rgba(28, 28, 30, 0.85)' 
      : 'rgba(255, 255, 255, 0.9)',
    ...Shadows.md,
  };

  const content = (
    <View style={[styles.innerContainer, style]}>
      {children}
    </View>
  );

  if (animated) {
    return (
      <Animated.View 
        entering={FadeIn.delay(delay).duration(400)}
        style={cardStyle}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    padding: Spacing.lg,
  },
});
