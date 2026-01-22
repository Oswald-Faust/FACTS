/**
 * FACTS - SourceCard Component
 * Clickable source card with domain info
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Source } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../contexts/AppContext';

interface SourceCardProps {
  source: Source;
  index: number;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (source.url) {
      Linking.openURL(source.url);
    }
  };

  const getTrustColor = () => {
    const score = source.trustScore || 70;
    if (score >= 80) return Colors.verdict.true;
    if (score >= 60) return Colors.semantic.warning;
    return Colors.verdict.false;
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? Colors.dark.card : Colors.light.card,
            borderColor: isDark ? Colors.dark.surface : Colors.neutral.gray[200],
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.domainBadge, { backgroundColor: Colors.primary.main + '20' }]}>
            <Ionicons name="globe-outline" size={14} color={Colors.primary.main} />
            <Text style={[styles.domain, { color: Colors.primary.main }]}>
              {source.domain}
            </Text>
          </View>
          {source.trustScore && (
            <View style={[styles.trustBadge, { backgroundColor: getTrustColor() + '20' }]}>
              <Text style={[styles.trustScore, { color: getTrustColor() }]}>
                {source.trustScore}%
              </Text>
            </View>
          )}
        </View>
        
        <Text 
          style={[
            styles.title,
            { color: isDark ? Colors.neutral.white : Colors.neutral.black }
          ]}
          numberOfLines={2}
        >
          {source.title}
        </Text>
        
        {source.snippet && (
          <Text 
            style={[
              styles.snippet,
              { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }
            ]}
            numberOfLines={2}
          >
            {source.snippet}
          </Text>
        )}

        <View style={styles.footer}>
          {source.publishedDate && (
            <Text style={[styles.date, { color: isDark ? Colors.neutral.gray[500] : Colors.neutral.gray[500] }]}>
              {source.publishedDate}
            </Text>
          )}
          <Ionicons 
            name="open-outline" 
            size={16} 
            color={isDark ? Colors.neutral.gray[500] : Colors.neutral.gray[400]} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  domain: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  trustBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  trustScore: {
    ...Typography.caption1,
    fontWeight: '700',
  },
  title: {
    ...Typography.headline,
  },
  snippet: {
    ...Typography.subheadline,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  date: {
    ...Typography.caption2,
  },
});
