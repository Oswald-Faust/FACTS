/**
 * FACTS - Result Screen
 * Premium verdict display with sources and analysis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  useDerivedValue,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useApp, useTheme } from '../contexts/AppContext';
import { VERDICTS } from '../constants/onboarding';
import { FactCheckResult } from '../types';
import GlassCard from '../components/GlassCard';
import SourceCard from '../components/SourceCard';
import GradientButton from '../components/GradientButton';

interface ResultScreenProps {
  onBack: () => void;
  onNewCheck: () => void;
}

export default function ResultScreen({ onBack, onNewCheck }: ResultScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { state: { currentFactCheck, history } } = useApp();
  
  // Get fact check data
  const factCheck = currentFactCheck || (history.length > 0 ? history[0].factCheck : null);

  // Animation values
  const progress = useSharedValue(0);
  const RADIUS = 70;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    if (factCheck) {
      // Small delay to let the screen mount
      progress.value = withDelay(500, withTiming(factCheck.confidenceScore / 100, { duration: 1500 }));
    }
  }, [factCheck]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  // Derived value for the counter text
  const counterText = useDerivedValue(() => {
    return `${Math.round(progress.value * 100)}%`;
  });

  if (!factCheck) {
    // ... rest of empty state remains same (simplified for replace_file_content)
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
        <LinearGradient
          colors={isDark ? ['#0A0A0A', '#1A1A2E', '#0A0A0A'] : ['#F2F2F7', '#E5E5EA', '#F2F2F7']}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="document-text-outline" size={64} color={isDark ? Colors.neutral.gray[600] : Colors.neutral.gray[400]} />
        <Text style={[styles.emptyTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
          Aucun résultat
        </Text>
        <Text style={[styles.emptyText, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
          Effectuez une vérification pour voir les résultats ici.
        </Text>
        <GradientButton title="Nouvelle vérification" onPress={onNewCheck} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  const { 
    claim, 
    verdict, 
    confidenceScore, 
    summary, 
    analysis, 
    sources, 
    visualAnalysis,
    imageUrl,
    processingTimeMs,
    createdAt 
  } = factCheck;

  const verdictData = VERDICTS[verdict] || VERDICTS.UNVERIFIED;

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `FACTS - Vérification\n\n"${claim}"\n\nVerdict: ${verdictData.label}\nConfiance: ${confidenceScore}%\n\n${summary}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Get icon for verdict
  const getVerdictIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (verdict) {
      case 'TRUE': return 'checkmark-circle';
      case 'FALSE': return 'close-circle';
      case 'MISLEADING': return 'warning';
      case 'NUANCED': return 'remove-circle';
      case 'AI_GENERATED': return 'hardware-chip';
      case 'MANIPULATED': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#1A1A2E', '#0A0A0A'] : ['#F2F2F7', '#E5E5EA', '#F2F2F7']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={isDark ? Colors.neutral.white : Colors.neutral.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
          Résultat
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Verdict Section with Animated Circular Progress */}
        <View style={styles.verdictSection}>
          <Animated.View 
            entering={FadeInUp.delay(200).springify()}
            style={styles.circleContainer}
          >
            <Svg width={160} height={160} style={styles.svg}>
              {/* Background Circle */}
              <SvgCircle
                cx="80"
                cy="80"
                r={RADIUS}
                stroke={isDark ? Colors.dark.surface : Colors.neutral.gray[200]}
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <AnimatedCircle
                cx="80"
                cy="80"
                r={RADIUS}
                stroke={verdictData.color}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            
            <View style={[
              styles.innerCircle,
              { backgroundColor: verdictData.color + '15' }
            ]}>
              <Ionicons
                name={getVerdictIcon()}
                size={70}
                color={verdictData.color}
              />
            </View>
          </Animated.View>
          
          <Animated.Text 
            entering={FadeIn.delay(400)}
            style={[styles.verdictLabel, { color: verdictData.color }]}
          >
            {verdictData.label}
          </Animated.Text>
          
          {/* Confidence Score Display */}
          <Animated.View 
            entering={FadeIn.delay(600)}
            style={styles.scoreBadge}
          >
            <Text style={[styles.scoreText, { color: verdictData.color }]}>
              {confidenceScore}%
            </Text>
            <Text style={[styles.scoreLabel, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
              Confiance
            </Text>
          </Animated.View>
          
          <Animated.Text 
            entering={FadeInUp.delay(800)}
            style={[styles.verdictDescription, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}
          >
            {verdictData.description}
          </Animated.Text>
        </View>

        {/* Claim Card */}
        <GlassCard style={styles.card} animated={false}>
          <Text style={[styles.cardLabel, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
            AFFIRMATION VÉRIFIÉE
          </Text>
          <Text style={[styles.claimText, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
            "{claim}"
          </Text>
          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.claimImage} />
          )}
        </GlassCard>

        {/* Summary Card */}
        <GlassCard style={styles.card} animated={false}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color={Colors.primary.main} />
            <Text style={[styles.cardTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
              Résumé
            </Text>
          </View>
          <Text style={[styles.cardContent, { color: isDark ? Colors.neutral.gray[300] : Colors.neutral.gray[700] }]}>
            {summary}
          </Text>
        </GlassCard>

        {/* Visual Analysis (if image) */}
        {visualAnalysis && (
          <GlassCard style={styles.card} animated={false}>
            <View style={styles.cardHeader}>
              <Ionicons name="eye" size={20} color={Colors.verdict.aiGenerated} />
              <Text style={[styles.cardTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
                Analyse Forensique
              </Text>
            </View>
            
            <View style={styles.forensicGrid}>
              <View style={[styles.forensicItem, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[100] }]}>
                <Ionicons 
                  name={visualAnalysis.isAIGenerated ? "warning" : "checkmark-circle"} 
                  size={24} 
                  color={visualAnalysis.isAIGenerated ? Colors.verdict.aiGenerated : Colors.verdict.true} 
                />
                <Text style={[styles.forensicLabel, { color: isDark ? Colors.neutral.gray[300] : Colors.neutral.gray[700] }]}>
                  {visualAnalysis.isAIGenerated ? "Image IA" : "Authentique"}
                </Text>
              </View>
              
              <View style={[styles.forensicItem, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[100] }]}>
                <Ionicons 
                  name={visualAnalysis.isManipulated ? "warning" : "checkmark-circle"} 
                  size={24} 
                  color={visualAnalysis.isManipulated ? Colors.verdict.false : Colors.verdict.true} 
                />
                <Text style={[styles.forensicLabel, { color: isDark ? Colors.neutral.gray[300] : Colors.neutral.gray[700] }]}>
                  {visualAnalysis.isManipulated ? "Manipulée" : "Non manipulée"}
                </Text>
              </View>
            </View>

            {visualAnalysis.details && (
              <Text style={[styles.forensicDetails, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
                {visualAnalysis.details}
              </Text>
            )}
          </GlassCard>
        )}

        {/* Detailed Analysis */}
        {analysis && (
          <GlassCard style={styles.card} animated={false}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color={Colors.primary.main} />
              <Text style={[styles.cardTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
                Analyse détaillée
              </Text>
            </View>
            <View style={styles.analysisContainer}>
              {analysis.split('\n').filter(line => line.trim().length > 0).map((line, index) => {
                const isBullet = line.trim().startsWith('-');
                let cleanLine = isBullet ? line.trim().substring(1).trim() : line.trim();
                
                // Safety: remove all ** markers as they don't render well in the UI
                cleanLine = cleanLine.replace(/\*\*/g, '');
                
                // Don't render technical markers or headers already in the card
                const upperLine = cleanLine.toUpperCase();
                if (upperLine.includes("RAPPORT D'ANALYSE DÉTAILLÉ")) return null;
                if (upperLine.includes("SECTION FINALE")) return null;
                if (upperLine.includes("SOURCES_DETAILS")) return null;
                
                // Hide lines that indicate lack of relevant info or generic placeholders
                const isNoInfo = /\:\s*N\/?A/i.test(cleanLine) || 
                                 cleanLine.trim().toUpperCase() === "N/A" ||
                                 upperLine.includes("SANS OBJET") ||
                                 upperLine.includes("AFFIRMATION TEXTUELLE") ||
                                 upperLine.includes("AUCUN INDICE") ||
                                 upperLine.includes("PAS D'INDICES");
                
                if (isNoInfo) return null;

                // Split by first colon to bold the label
                const colonIndex = cleanLine.indexOf(':');
                const hasLabel = colonIndex !== -1 && colonIndex < 40; // Avoid splitting long sentences without real labels

                return (
                  <View key={`analysis-${index}`} style={isBullet ? styles.analysisBullet : styles.analysisText}>
                    {isBullet && <View style={[styles.bulletPoint, { backgroundColor: Colors.primary.main }]} />}
                    <Text style={[
                      styles.cardContent, 
                      { color: isDark ? Colors.neutral.gray[300] : Colors.neutral.gray[700] },
                      isBullet && { flex: 1 }
                    ]}>
                      {hasLabel ? (
                        <>
                          <Text style={{ fontWeight: '700', color: isDark ? Colors.neutral.white : Colors.neutral.black }}>
                            {cleanLine.substring(0, colonIndex + 1)}
                          </Text>
                          {cleanLine.substring(colonIndex + 1)}
                        </>
                      ) : cleanLine}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <View style={styles.sourcesHeader}>
              <View style={styles.sourcesTitleContainer}>
                <Ionicons name="link" size={20} color={Colors.primary.main} />
                <Text style={[styles.cardTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
                  Sources ({sources.length})
                </Text>
              </View>
              <Text style={[styles.sourcesSubtitle, { color: isDark ? Colors.neutral.gray[500] : Colors.neutral.gray[500] }]}>
                Balayez pour voir
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sourcesScrollContent}
              snapToInterval={280 + Spacing.md}
              decelerationRate="fast"
            >
              {sources.map((source, index) => (
                <SourceCard key={`source-${index}`} source={source} index={index} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={[styles.metadataText, { color: isDark ? Colors.neutral.gray[500] : Colors.neutral.gray[500] }]}>
            Analysé en {(processingTimeMs / 1000).toFixed(1)}s • {new Date(createdAt).toLocaleString('fr-FR')}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton
            title="Nouvelle vérification"
            onPress={onNewCheck}
            icon={<Ionicons name="add" size={20} color={Colors.neutral.white} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.title3,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.subheadline,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headline,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  verdictSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  circleContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  innerCircle: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scoreText: {
    ...Typography.title2,
    fontWeight: '800',
  },
  scoreLabel: {
    ...Typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verdictCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictLabel: {
    ...Typography.title1,
    fontWeight: '800',
    letterSpacing: 2,
  },
  verdictDescription: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
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
  card: {
    gap: Spacing.sm,
  },
  cardLabel: {
    ...Typography.caption1,
    letterSpacing: 1,
  },
  claimText: {
    ...Typography.title3,
    fontStyle: 'italic',
  },
  claimImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Typography.headline,
  },
  cardContent: {
    ...Typography.body,
    lineHeight: 24,
  },
  analysisContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  analysisBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  analysisText: {
    paddingVertical: 2,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  forensicGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  forensicItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  forensicLabel: {
    ...Typography.caption1,
    flex: 1,
  },
  forensicDetails: {
    ...Typography.footnote,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  sourcesSection: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  sourcesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sourcesSubtitle: {
    ...Typography.caption2,
    opacity: 0.7,
  },
  sourcesScrollContent: {
    paddingRight: Spacing.xl,
    gap: Spacing.md,
  },
  metadata: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  metadataText: {
    ...Typography.caption2,
  },
  actions: {
    paddingTop: Spacing.md,
  },
});
