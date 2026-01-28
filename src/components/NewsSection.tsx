import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../contexts/AppContext';
import ApiService from '../services/api';

interface NewsSectionProps {
  onSelectSuggestion: (text: string) => void;
}

export default function NewsSection({ onSelectSuggestion }: NewsSectionProps) {
  const theme = useTheme();
  const isDark = theme === 'dark';
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getNewsSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load news suggestions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCard = (text: string, index: number) => {
    const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#000000';

    return (
      <Animated.View
        key={index}
        entering={FadeInUp.delay(500 + (index * 100)).springify()}
        style={styles.cardWrapper}
      >
        <TouchableOpacity
          onPress={() => onSelectSuggestion(text)}
          activeOpacity={0.7}
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          <View style={styles.iconContainer}>
             <Ionicons name="newspaper-outline" size={20} color={Colors.primary.main} />
          </View>
          <Text style={[styles.cardText, { color: textColor }]} numberOfLines={3}>
            {text}
          </Text>
          <Ionicons name="add-circle-outline" size={20} color={isDark ? '#555' : '#CCC'} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
      return (
          <View style={styles.container}>
             <ActivityIndicator size="small" color={Colors.primary.main} />
          </View>
      );
  }

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.Text 
        entering={FadeInUp.delay(400)} 
        style={[styles.sectionTitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}
      >
        ANALYSER L'ACTUALITÉ
      </Animated.Text>
      
      <View style={styles.list}>
        {suggestions.map((item, index) => renderCard(item, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption1,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  list: {
    gap: Spacing.md,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
