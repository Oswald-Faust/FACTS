/**
 * FACTS - History Screen (Redesigned)
 * Style: Clean, Card-based "Chronicles"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useApp, useTheme } from '../contexts/AppContext';
import { HistoryItem } from '../types';
import SoftBackground from '../components/SoftBackground';

const { width } = Dimensions.get('window');

interface HistoryScreenProps {
  onBack: () => void;
  onSelectItem: (item: HistoryItem) => void;
}

export default function HistoryScreen({ onBack, onSelectItem }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { state: { history }, dispatch, removeFactCheck, clearHistory } = useApp();

  const handleSelectItem = (item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'SET_CURRENT_FACT_CHECK', payload: item.factCheck });
    onSelectItem(item);
  };

  const handleDeleteItem = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
        "Supprimer",
        "Voulez-vous vraiment supprimer cette vérification ?",
        [
            { text: "Annuler", style: "cancel" },
            { 
                text: "Supprimer", 
                style: "destructive", 
                onPress: () => removeFactCheck(id) 
            }
        ]
    );
  };

  const handleClearHistory = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
        "Historique", 
        "Voulez-vous vraiment TOUT effacer ?",
        [
            { text: "Annuler", style: "cancel" },
            { 
                text: "Tout effacer", 
                style: "destructive", 
                onPress: clearHistory 
            }
        ]
    );
  };

  const showOptions = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
          "Options",
          undefined,
          [
              { text: "Tout effacer", style: "destructive", onPress: handleClearHistory },
              { text: "Annuler", style: "cancel" }
          ]
      );
  };

  const renderHistoryItem = ({ item, index }: { item: HistoryItem; index: number }) => {
    const date = new Date(item.savedAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    
    // Capitalize first letter of date
    const formattedDate = date.charAt(0).toUpperCase() + date.slice(1);
    
    const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#000000';
    
    // Check for source images or main image
    const displayImage = item.factCheck.imageUrl;

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).springify()}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          onPress={() => handleSelectItem(item)}
          onLongPress={() => handleDeleteItem(item.id)}
          activeOpacity={0.9}
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          {/* Header Date */}
          <View style={styles.cardHeader}>
             <Text style={[styles.cardDate, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
              {formattedDate}
            </Text>
            <View style={[
              styles.verdictBadgeSmall, 
              { backgroundColor: getVerdictColor(item.factCheck.verdict) + '15' }
            ]}>
               <Text style={[
                styles.verdictTextSmall, 
                { color: getVerdictColor(item.factCheck.verdict) }
              ]}>
                {getVerdictLabel(item.factCheck.verdict)}
              </Text>
            </View>
          </View>
            
          {/* Main Content */}
          <View style={styles.cardContent}>
            <Text 
              style={[styles.cardTitle, { color: textColor }]}
              numberOfLines={4}
            >
              {item.factCheck.claim}
            </Text>
          </View>

          {/* Footer Visual - Only if image exists, otherwise minimal spacing */}
          {displayImage && (
             <View style={styles.cardImageContainer}>
                <Image 
                  source={{ uri: displayImage }} 
                  style={styles.cardSourceImage} 
                />
             </View>
          )}

          {!displayImage && (
             <View style={{ height: 20 }} />
          )}
          
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
       <SoftBackground isDark={isDark} />
       
      <View style={[styles.header, { paddingTop: insets.top }]}>
         <TouchableOpacity onPress={onBack} style={styles.backButton}>
             <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#000'} />
         </TouchableOpacity>
         <TouchableOpacity onPress={showOptions} style={styles.menuButton}>
             <Ionicons name="ellipsis-horizontal-circle" size={28} color={isDark ? '#FFF' : '#000'} />
         </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xxl }
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'TRUE': return Colors.verdict.true;
    case 'FALSE': return Colors.verdict.false;
    case 'MISLEADING': return Colors.verdict.misleading;
    case 'NUANCED': return Colors.verdict.nuanced;
    default: return Colors.neutral.gray[500];
  }
}

function getVerdictLabel(verdict: string): string {
    // Simplified labels
    switch (verdict) {
      case 'TRUE': return 'VRAI';
      case 'FALSE': return 'FAUX';
      case 'MISLEADING': return 'TROMPEUR';
      case 'NUANCED': return 'NUANCE';
      case 'AI_GENERATED': return 'IA';
      default: return '?';
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.xs,
  },
  menuButton: {
    padding: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: Spacing.lg,
    minHeight: 180, 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardDate: {
    ...Typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    fontSize: 11,
  },
  verdictBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verdictTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardContent: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 20, // Slightly smaller for list
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardImageContainer: {
    height: 140,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: Spacing.xs,
  },
  cardSourceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
