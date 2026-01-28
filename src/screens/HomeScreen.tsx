/**
 * FACTS - Home Screen (Redesigned)
 * Aesthetic: Minimalist, Soft, "Dot"-like
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useApp, useTheme } from '../contexts/AppContext';
import ApiService, { ApiError } from '../services/api';
import * as Storage from '../services/storage';
import SoftBackground from '../components/SoftBackground';

import NewsSection from '../components/NewsSection';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigateToResult: () => void;
  onNavigateToHistory: () => void;
  onNavigateToNews: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPaywall: () => void;
}

export default function HomeScreen({ 
  onNavigateToResult, 
  onNavigateToHistory,
  onNavigateToNews, 
  onNavigateToProfile,
  onNavigateToPaywall 
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const { dispatch, state: { history, draftClaim }, setDraftClaim } = useApp();

  const [claim, setClaim] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageContext, setImageContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill from news suggestion
  React.useEffect(() => {
      if (draftClaim) {
          setClaim(draftClaim);
          setDraftClaim('');
      }
  }, [draftClaim]);
  
  // Animation values
  const inputScale = useSharedValue(1);
  const contentOpacity = useSharedValue(1);

  // Handlers
  const handleFocus = () => {
    inputScale.value = withSpring(1.01, { damping: 20 });
  };

  const handleBlur = () => {
    inputScale.value = withSpring(1, { damping: 20 });
  };

  const pickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [tempLink, setTempLink] = useState('');

  const handleLinkSubmit = () => {
    if (!tempLink.trim()) {
      setIsLinkModalVisible(false);
      return;
    }

    const url = tempLink.trim();
    // Basic check if it's an image file
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

    if (isImage) {
      setImageUri(url);
    } else {
      // It's a video or article link -> Add to claim text or context
      const newClaim = claim ? `${claim}\n\nContexte: ${url}` : `Analyse ce lien: ${url}`;
      setClaim(newClaim);
    }
    
    setTempLink('');
    setIsLinkModalVisible(false);
  };

  const removeImage = () => {
    setImageUri(null);
    setImageContext('');
  };

  const handleVerify = async () => {
      if (!claim.trim() && !imageUri) return;
  
      setIsLoading(true);
      contentOpacity.value = withTiming(0.5); // Dim content while loading
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  
      try {
        // Use backend verification (enforces quota)
        const result = await ApiService.verifyFactCheck(
          imageUri ? (imageContext || claim || 'Analyse d\'image') : claim, 
          imageUri || undefined
        );
        
        // Manually update state and local storage (avoiding double API call from addFactCheck)
        dispatch({ type: 'ADD_FACT_CHECK', payload: result });
        await Storage.saveFactCheck(result);
        
        // Reset and Navigate
        setClaim('');
        setImageUri(null);
        setImageContext('');
        contentOpacity.value = withTiming(1);
        onNavigateToResult();
      } catch (error: any) {
        contentOpacity.value = withTiming(1);
        setIsLoading(false);
        
        if (error instanceof ApiError && error.status === 403) {
            // Quota exceeded
            onNavigateToPaywall();
        } else {
            Alert.alert('Erreur', error.message || 'Impossible de vérifier pour le moment.');
        }
      }
    };

  // Styles
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
    opacity: contentOpacity.value,
  }));

  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const cardBg = isDark ? 'rgba(30,30,40,0.8)' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <SoftBackground isDark={isDark} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <TouchableOpacity onPress={onNavigateToProfile} style={styles.iconButton}>
               <Ionicons name="person-circle-outline" size={28} color={textColor} />
            </TouchableOpacity>
            
            <View /> 
 
            <TouchableOpacity onPress={onNavigateToHistory} style={styles.iconButton}>
               <Ionicons name="time-outline" size={28} color={textColor} />
            </TouchableOpacity>
          </Animated.View>

          {/* Main Title */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.titleContainer}>
            <Text style={[styles.mainTitle, { color: textColor }]}>
              La vérité sans filtres !
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Vérifiez une information ou une image et même une vidéo instantanément.
            </Text>
          </Animated.View>

          {/* Main Input Card */}
          <Animated.View 
            entering={FadeInUp.delay(300).springify()} 
            style={styles.cardContainer}
          >
            <Animated.View 
               style={[styles.card, { backgroundColor: cardBg }, inputAnimatedStyle]}
            >
              
              {/* Image Preview if selected */}
              {imageUri && (
                <View style={styles.imagePreviewContainer}>
                   <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                   <TouchableOpacity onPress={removeImage} style={styles.removeImage}>
                      <Ionicons name="close-circle-sharp" size={24} color="#FFF" />
                   </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={[styles.input, { color: textColor, minHeight: imageUri ? 60 : 120 }]}
                placeholder={imageUri ? "Ajoutez du contexte..." : "Entrez une affirmation, une citation..."}
                placeholderTextColor={placeholderColor}
                multiline
                value={imageUri ? imageContext : claim}
                onChangeText={imageUri ? setImageContext : setClaim}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <View style={styles.cardActions}>
                 <View style={styles.actionLeft}>
                    <TouchableOpacity onPress={pickImage} style={styles.actionButton}>
                       <Ionicons name="image-outline" size={22} color={Colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={takePhoto} style={styles.actionButton}>
                       <Ionicons name="camera-outline" size={22} color={Colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsLinkModalVisible(true)} style={styles.actionButton}>
                       <Ionicons name="link-outline" size={22} color={Colors.primary.main} />
                    </TouchableOpacity>
                 </View>

                 <TouchableOpacity 
                    style={[
                      styles.verifyBtn, 
                      { 
                         backgroundColor: (claim.trim() || imageUri) 
                          ? (isDark ? Colors.neutral.white : Colors.neutral.black)
                          : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                      }
                    ]}
                    disabled={!claim.trim() && !imageUri}
                    onPress={handleVerify}
                 >
                    {isLoading ? (
                       <View style={styles.loadingDot} />
                    ) : (
                       <Ionicons 
                        name="arrow-up" 
                        size={20} 
                        color={isDark ? Colors.neutral.black : Colors.neutral.white} 
                       />
                    )}
                 </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>

          {/* News Suggestions Section */}
          <NewsSection 
            onSelectSuggestion={(suggestion: string) => {
              setClaim(suggestion);
              
              // Scroll to top to see input (optional, but good UX)
              // We could use a ref to scrollView if needed
            }} 
          />

          {/* Link Modal */}
          {isLinkModalVisible && (
            <View style={styles.modalOverlay}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Coller un lien</Text>
                  <Text style={[styles.modalSubtitle, { color: isDark ? '#AAA' : '#666' }]}>
                    Image, vidéo (YouTube, TikTok...) ou article
                  </Text>
                  
                  <TextInput 
                    style={[styles.modalInput, { 
                      color: textColor, 
                      backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5',
                      borderColor: isDark ? '#3A3A3C' : '#E0E0E0'
                    }]}
                    placeholder="https://..."
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={tempLink}
                    onChangeText={setTempLink}
                    autoFocus
                  />
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsLinkModalVisible(false);
                        setTempLink('');
                      }} 
                      style={styles.modalButton}
                    >
                      <Text style={{ color: isDark ? '#FFF' : '#000' }}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleLinkSubmit} 
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          )}

          {/* Recents minimalist list - REMOVED */}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'TRUE': return Colors.verdict.true;
    case 'FALSE': return Colors.verdict.false;
    case 'MISLEADING': return Colors.verdict.misleading;
    default: return Colors.neutral.gray[400];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    height: 50,
  },
  iconButton: {
    padding: Spacing.sm,
  },
  titleContainer: {
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28, // Not too huge
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Trying to get that serif look
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    maxWidth: width * 0.7,
  },
  cardContainer: {
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: 24,
    padding: Spacing.lg,
  },
  input: {
    ...Typography.body,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLeft: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
    opacity: 0.6,
  },
  verifyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF', // Adapt for theme if key?
  },
  imagePreviewContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    resizeMode: 'cover',
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  recentsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.caption1,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  verdictDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentText: {
    ...Typography.subheadline,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary.main,
  },
});
