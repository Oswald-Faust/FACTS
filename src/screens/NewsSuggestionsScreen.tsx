/**
 * FACTS - News Suggestions Screen
 * Dynamic AI-generated news questions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { useTheme, useApp } from '../contexts/AppContext';
import SoftBackground from '../components/SoftBackground';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

interface NewsSuggestionsScreenProps {
  onBack: () => void;
  onSelectSuggestion: () => void;
}

export default function NewsSuggestionsScreen({ onBack, onSelectSuggestion }: NewsSuggestionsScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { setDraftClaim } = useApp();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSuggestions = async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      const data = await ApiService.getNewsSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchSuggestions();
  };

  const handleSelect = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDraftClaim(text);
    onSelectSuggestion();
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
    const textColor = isDark ? '#FFFFFF' : '#000000';

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 150).springify()}
        style={styles.cardContainer}
      >
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          <View style={styles.iconContainer}>
             <Ionicons name="newspaper-outline" size={24} color={Colors.primary.main} />
          </View>
          <Text style={[styles.cardText, { color: textColor }]}>
            {item}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={isDark ? '#555' : '#CCC'} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <SoftBackground isDark={isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
         <TouchableOpacity onPress={onBack} style={styles.backButton}>
             <Ionicons name="chevron-back" size={28} color={isDark ? '#FFF' : '#000'} />
         </TouchableOpacity>
         <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
             Actualité
         </Text>
         <View style={{ width: 40 }} /> 
      </View>

      <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
        Questions générées par l'IA basées sur l'actualité mondiale très récente.
      </Text>

      {isLoading && !isRefreshing ? (
         <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={[styles.loadingText, { color: isDark ? '#AAA' : '#666' }]}>
                Analyse de l'actualité...
            </Text>
         </View>
      ) : (
        <FlatList
            data={suggestions}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary.main} />
            }
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={{ color: isDark ? '#FFF' : '#000' }}>Aucune suggestion disponible.</Text>
                </View>
            }
        />
      )}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)', // Primary tint?
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
  },
  loadingText: {
      fontSize: 14,
  },
  emptyContainer: {
      padding: Spacing.xl,
      alignItems: 'center',
  }
});
