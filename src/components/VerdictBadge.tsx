/**
 * FACTS - VerdictBadge Component
 * Animated verdict display with confidence gauge
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VerdictType } from '../types';
import { VERDICTS } from '../constants/onboarding';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../contexts/AppContext';

interface VerdictBadgeProps {
  verdict: VerdictType;
  confidenceScore: number;
  animate?: boolean;
  size?: 'small' | 'large';
}

export default function VerdictBadge({
  verdict,
  confidenceScore,
  animate = true,
  size = 'large',
}: VerdictBadgeProps) {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const verdictData = VERDICTS[verdict];
  
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const gaugeProgress = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      // Haptic feedback based on verdict
      if (verdict === 'TRUE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (verdict === 'FALSE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // Animate in
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      rotation.value = withSpring(360, { damping: 15 });
      gaugeProgress.value = withDelay(
        300,
        withTiming(confidenceScore / 100, { duration: 1000, easing: Easing.out(Easing.cubic) })
      );
    } else {
      scale.value = 1;
      gaugeProgress.value = confidenceScore / 100;
    }
  }, [verdict, confidenceScore, animate]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  const gaugeAnimatedStyle = useAnimatedStyle(() => ({
    width: `${gaugeProgress.value * 100}%`,
  }));

  const isLarge = size === 'large';
  const iconSize = isLarge ? 80 : 40;
  const containerSize = isLarge ? 140 : 70;

  return (
    <View style={styles.container}>
      {/* Main Verdict Circle */}
      <Animated.View 
        entering={animate ? ZoomIn.springify().damping(12) : undefined}
        style={[
          styles.verdictCircle,
          {
            width: containerSize,
            height: containerSize,
            backgroundColor: verdictData.color + '20',
            borderColor: verdictData.color,
            ...Shadows.glow(verdictData.color),
          },
        ]}
      >
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={getIonIconName(verdict)}
            size={iconSize}
            color={verdictData.color}
          />
        </Animated.View>
      </Animated.View>

      {/* Verdict Label */}
      <Animated.Text
        entering={animate ? FadeIn.delay(200) : undefined}
        style={[
          isLarge ? styles.verdictLabel : styles.verdictLabelSmall,
          { color: verdictData.color },
        ]}
      >
        {verdictData.label}
      </Animated.Text>

      {/* Confidence Gauge */}
      {isLarge && (
        <Animated.View
          entering={animate ? FadeIn.delay(300) : undefined}
          style={styles.gaugeContainer}
        >
          <View style={styles.gaugeHeader}>
            <Text style={[styles.gaugeLabel, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
              Indice de confiance
            </Text>
            <Text style={[styles.gaugeValue, { color: verdictData.color }]}>
              {confidenceScore}%
            </Text>
          </View>
          <View style={[
            styles.gaugeTrack,
            { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[200] }
          ]}>
            <Animated.View 
              style={[
                styles.gaugeFill,
                { backgroundColor: verdictData.color },
                gaugeAnimatedStyle,
              ]} 
            />
          </View>
        </Animated.View>
      )}

      {/* Description */}
      {isLarge && (
        <Animated.Text
          entering={animate ? FadeIn.delay(400) : undefined}
          style={[
            styles.description,
            { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }
          ]}
        >
          {verdictData.description}
        </Animated.Text>
      )}
    </View>
  );
}

function getIonIconName(verdict: VerdictType): keyof typeof Ionicons.glyphMap {
  switch (verdict) {
    case 'TRUE':
      return 'checkmark-circle';
    case 'FALSE':
      return 'close-circle';
    case 'MISLEADING':
      return 'warning';
    case 'NUANCED':
      return 'remove-circle';
    case 'AI_GENERATED':
      return 'hardware-chip';
    case 'MANIPULATED':
      return 'alert-circle';
    case 'UNVERIFIED':
    default:
      return 'help-circle';
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  verdictCircle: {
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictLabel: {
    ...Typography.title1,
    fontWeight: '800',
    letterSpacing: 2,
  },
  verdictLabelSmall: {
    ...Typography.headline,
    fontWeight: '700',
    letterSpacing: 1,
  },
  gaugeContainer: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.sm,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeLabel: {
    ...Typography.subheadline,
  },
  gaugeValue: {
    ...Typography.headline,
    fontWeight: '700',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  description: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
