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

  const showDomain = source.domain && !source.domain.includes('vertexaisearch');
  // Use snippet as description, but clean it if it's too generic
  const description = source.snippet && 
                     !source.snippet.includes('Source vérifiée') && 
                     !source.snippet.includes('Google Search') ? source.snippet : null;

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <View style={styles.topInfo}>
          {showDomain && (
            <View style={[styles.domainBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.domainText, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
                {source.domain}
              </Text>
            </View>
          )}
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary.main + '15' }]}>
            <Ionicons name="link" size={14} color={Colors.primary.main} />
          </View>
        </View>
        
        <View style={styles.content}>
          <Text 
            style={[
              styles.title,
              { color: isDark ? Colors.neutral.white : Colors.neutral.black }
            ]}
            numberOfLines={2}
          >
            {source.title || 'Source vérifiée'}
          </Text>
          
          {description && (
            <Text 
              style={[
                styles.snippet,
                { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[500] }
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.actionLink}>
            <Text style={[styles.actionText, { color: Colors.primary.main }]}>
              Visiter le site
            </Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.primary.main} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    justifyContent: 'space-between',
    minHeight: 180,
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainText: {
    ...Typography.caption2,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: 6,
  },
  title: {
    ...Typography.headline,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  snippet: {
    ...Typography.caption1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.sm,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...Typography.caption1,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
