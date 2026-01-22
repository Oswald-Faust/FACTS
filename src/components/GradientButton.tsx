/**
 * FACTS - GradientButton Component
 * Premium animated button with gradient
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function GradientButton({
  title,
  onPress,
  gradient = ['#1A1A1A', '#333333'], // Premium black gradient
  style,
  textStyle,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  size = 'large',
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 40, paddingHorizontal: Spacing.md };
      case 'medium':
        return { height: 48, paddingHorizontal: Spacing.lg };
      case 'large':
      default:
        return { height: 56, paddingHorizontal: Spacing.xl };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return Typography.subheadline;
      case 'medium':
        return Typography.callout;
      case 'large':
      default:
        return Typography.headline;
    }
  };

  if (variant === 'ghost') {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.ghostButton,
          getSizeStyles(),
          animatedStyle,
          style,
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary.main} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[
              styles.ghostText,
              getTextSize(),
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </AnimatedTouchable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedTouchable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.secondaryButton,
          getSizeStyles(),
          animatedStyle,
          disabled && styles.disabled,
          style,
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary.main} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[
              styles.secondaryText,
              getTextSize(),
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        getSizeStyles(),
        animatedStyle,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={disabled ? [Colors.neutral.gray[400], Colors.neutral.gray[500]] : gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.neutral.white} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[
              styles.text,
              getTextSize(),
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100, // Pill shape
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  text: {
    color: Colors.neutral.white,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.15)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryText: {
    color: '#1A1A1A',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#1A1A1A',
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});

