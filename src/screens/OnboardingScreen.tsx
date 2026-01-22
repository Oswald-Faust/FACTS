/**
 * FACTS - Premium Onboarding Screen
 * 3 dynamic slides with forensic analysis explanation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ONBOARDING_SLIDES } from '../constants/onboarding';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import { useApp } from '../contexts/AppContext';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    onComplete();
  };

  const renderSlide = ({ item, index }: { item: typeof ONBOARDING_SLIDES[0]; index: number }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* Animated Icon */}
      <Animated.View 
        entering={FadeIn.delay(200).duration(600)}
        style={styles.iconContainer}
      >
        <View style={styles.iconCircle}>
          <Ionicons
            name={item.icon as any}
            size={80}
            color={Colors.neutral.white}
          />
        </View>
        
        {/* Floating particles effect */}
        <View style={[styles.particle, styles.particle1]} />
        <View style={[styles.particle, styles.particle2]} />
        <View style={[styles.particle, styles.particle3]} />
      </Animated.View>

      {/* Content */}
      <Animated.View 
        entering={SlideInUp.delay(300).springify().damping(15)}
        style={styles.content}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {ONBOARDING_SLIDES.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button */}
      {!isLastSlide && (
        <Animated.View 
          entering={FadeIn.delay(500)}
          style={[styles.skipButton, { top: insets.top + Spacing.md }]}
        >
          <GradientButton
            title="Passer"
            onPress={handleComplete}
            variant="ghost"
            size="small"
          />
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <Animated.View 
        entering={FadeInDown.delay(400).springify()}
        style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        {renderPagination()}
        
        <GradientButton
          title={isLastSlide ? "Commencer" : "Suivant"}
          onPress={handleNext}
          gradient={ONBOARDING_SLIDES[currentIndex].gradient}
          style={styles.nextButton}
        />
      </Animated.View>

      {/* FACTS Logo */}
      <Animated.View
        entering={FadeIn.delay(100)}
        style={[styles.logoContainer, { top: insets.top + Spacing.xxl }]}
      >
        <Text style={styles.logo}>FACTS</Text>
        <Text style={styles.tagline}>Vérité. Transparence. Confiance.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  iconContainer: {
    marginBottom: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  particle1: {
    top: -20,
    left: 40,
  },
  particle2: {
    bottom: -15,
    right: 30,
  },
  particle3: {
    top: 60,
    right: -25,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.neutral.gray[300],
    textAlign: 'center',
    lineHeight: 24,
  },
  skipButton: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.neutral.white,
  },
  nextButton: {
    width: '100%',
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.neutral.white,
    letterSpacing: 8,
  },
  tagline: {
    ...Typography.caption1,
    color: Colors.neutral.gray[400],
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
});
