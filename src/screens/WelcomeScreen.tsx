/**
 * FACTS - Welcome Onboarding Screen
 * Premium animated onboarding with swipe support
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onComplete: () => void;
}

interface BubbleData {
  id: string;
  text: string;
  emoji?: string;
  align: 'left' | 'right';
  delay: number;
}

interface SlideData {
  id: string;
  bubbles: BubbleData[];
  title: string;
  subtitle: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    bubbles: [
      { id: 'b1', text: '"Le vaccin modifie l\'ADN"', align: 'left', delay: 100 },
      { id: 'b2', text: '"La Terre est plate"', align: 'right', delay: 200 },
      { id: 'b3', text: '"Einstein a échoué en maths"', align: 'left', delay: 300 },
      { id: 'b4', text: '"On utilise 10% du cerveau"', align: 'right', delay: 400 },
    ],
    title: 'Vérifiez n\'importe quelle affirmation',
    subtitle: 'Textes, citations, statistiques... FACTS analyse tout en temps réel avec l\'IA.',
  },
  {
    id: '2',
    bubbles: [
      { id: 'b1', emoji: '🖼️', text: 'Image virale sur Twitter', align: 'left', delay: 100 },
      { id: 'b2', emoji: '📸', text: 'Photo d\'actualité douteuse', align: 'right', delay: 200 },
      { id: 'b3', emoji: '🤖', text: 'Image générée par IA ?', align: 'left', delay: 300 },
      { id: 'b4', emoji: '🔍', text: 'Deepfake potentiel', align: 'right', delay: 400 },
    ],
    title: 'Détectez les fausses images',
    subtitle: 'Notre analyse forensique détecte les images IA, les manipulations et les deepfakes.',
  },
  {
    id: '3',
    bubbles: [
      { id: 'b1', emoji: '✅', text: 'VRAI — Confiance 95%', align: 'left', delay: 100 },
      { id: 'b2', emoji: '❌', text: 'FAUX — Confiance 100%', align: 'right', delay: 200 },
      { id: 'b3', emoji: '⚠️', text: 'TROMPEUR — Contexte manquant', align: 'left', delay: 300 },
      { id: 'b4', emoji: '🔗', text: '10 sources vérifiées', align: 'right', delay: 400 },
    ],
    title: 'Des verdicts clairs et sourcés',
    subtitle: 'Chaque verdict est accompagné de sources vérifiables. Pas de zone grise.',
  },
];

function Bubble({ data }: { data: BubbleData }) {
  const entering = data.align === 'left' 
    ? FadeInLeft.delay(data.delay).springify().damping(14)
    : FadeInRight.delay(data.delay).springify().damping(14);

  return (
    <Animated.View
      entering={entering}
      style={[
        styles.bubble,
        data.align === 'right' && styles.bubbleRight,
      ]}
    >
      {data.emoji && <Text style={styles.bubbleEmoji}>{data.emoji}</Text>}
      <Text style={styles.bubbleText}>{data.text}</Text>
    </Animated.View>
  );
}

function SlideItem({ item }: { item: SlideData }) {
  return (
    <View style={styles.slide}>
      {/* Bubbles Section */}
      <View style={styles.bubblesSection}>
        {item.bubbles.map((bubble) => (
          <Bubble key={bubble.id} data={bubble} />
        ))}
      </View>

      {/* Text Section */}
      <Animated.View 
        entering={FadeInUp.delay(500).springify()}
        style={styles.textSection}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      if (viewableItems[0].index !== currentIndex) {
        setCurrentIndex(viewableItems[0].index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentIndex]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ 
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const handleDotPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flatListRef.current?.scrollToIndex({ 
      index,
      animated: true,
    });
  };

  const renderItem = useCallback(({ item }: { item: SlideData }) => (
    <SlideItem item={item} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDF6F4', '#F8E8E5', '#F0D9D5', '#E8CAC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with Logo */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.dotsLogo}>
            <View style={[styles.logoDot, styles.logoDotLeft]} />
            <View style={[styles.logoDot, styles.logoDotRight]} />
          </View>
        </View>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {/* Pagination - Now tappable */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={styles.dotTouchable}
            >
              <View
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Continuer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flex: 1,
  },
  dotsLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1A1A1A',
  },
  logoDotLeft: {
    marginRight: -5,
  },
  logoDotRight: {
    marginLeft: -5,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(26, 26, 26, 0.5)',
    fontWeight: '500',
  },
  slide: {
    width: width,
    flex: 1,
    paddingHorizontal: 24,
  },
  bubblesSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 8,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleEmoji: {
    fontSize: 18,
  },
  bubbleText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    flexShrink: 1,
  },
  textSection: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(26, 26, 26, 0.65)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dotTouchable: {
    padding: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(26, 26, 26, 0.2)',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#1A1A1A',
  },
  continueButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
