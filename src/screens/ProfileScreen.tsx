import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useApp, useTheme } from '../contexts/AppContext';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToPaywall: () => void;
}

export default function ProfileScreen({ onBack, onNavigateToPaywall }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [isUploading, setIsUploading] = React.useState(false);
  const { state, logout, setTheme, setUser } = useApp();
  const { user } = state;

  // Edit Profile State
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState('');

  const handleOpenEditProfile = () => {
    setEditName(user?.displayName || '');
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
        Alert.alert("Erreur", "Le nom ne peut pas être vide.");
        return;
    }

    try {
        const updatedUser = await ApiService.updateProfile({ displayName: editName.trim() });
        setUser(updatedUser);
        setIsEditModalVisible(false);
        Alert.alert("Succès", "Profil mis à jour !");
    } catch (error) {
        Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    }
  };

  const handlePickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        handleUploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleUploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      } as any);

      const response = await ApiService.uploadAvatar(formData);
      
      if (response.user) {
         setUser(response.user);
      }

      Alert.alert('Succès', 'Photo de profil mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'envoi de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Se déconnecter", 
          style: "destructive", 
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return 'Indéfini';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleManageSubscription = () => {
    if (user?.isPremium) {
      Alert.alert(
        "Gérer l'abonnement",
        "Votre abonnement est géré par l'App Store. Vous pouvez le modifier ou l'annuler dans les réglages de votre appareil.",
        [{ text: "OK" }]
      );
    } else {
      onNavigateToPaywall();
    }
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value?: string | React.ReactNode,
    onPress?: () => void,
    color?: string
  ) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: isDark ? Colors.dark.card : Colors.light.card }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[100] }]}>
          <Ionicons name={icon} size={20} color={color || (isDark ? Colors.neutral.white : Colors.neutral.black)} />
        </View>
        <Text style={[styles.settingLabel, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {typeof value === 'string' ? (
          <Text style={[styles.settingValue, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
            {value}
          </Text>
        ) : (
          value
        )}
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={Colors.neutral.gray[400]} style={{ marginLeft: 8 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
      <LinearGradient
        colors={isDark ? ['#0A0A0A', '#1A1A2E'] : ['#F2F2F7', '#E5E5EA']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          onPress={onBack} 
          style={[styles.backButton, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? Colors.neutral.white : Colors.neutral.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
          Profil
        </Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.profileHeader}>
          <View>
            <TouchableOpacity onPress={handlePickImage} disabled={isUploading}>
              <LinearGradient
                colors={Colors.primary.gradient as [string, string, ...string[]]}
                style={styles.avatar}
              >
                {user?.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                  </Text>
                )}
                {isUploading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editBadge, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.white }]}
              onPress={handlePickImage}
            >
              <Ionicons name="camera" size={16} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
            {user?.displayName || 'Utilisateur'}
          </Text>
          <Text style={[styles.userEmail, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[600] }]}>
            {user?.email}
          </Text>
          
          <View style={styles.statsContainer}>
             <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDark ? Colors.neutral.white : Colors.neutral.black }]}>
                  {state.history.length}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? Colors.neutral.gray[500] : Colors.neutral.gray[500] }]}>
                  Vérifications
                </Text>
             </View>
          </View>
        </Animated.View>

        {/* Subscription Section */}
        <Animated.View entering={FadeInUp.delay(150)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[500] }]}>
            ABONNEMENT
          </Text>

          {user?.isPremium ? (
             <View style={[styles.sectionContent, { backgroundColor: isDark ? Colors.dark.card : Colors.light.card, padding: 0 }]}>
                 <TouchableOpacity onPress={handleManageSubscription} style={styles.subscriptionRow}>
                    <View style={styles.subLeft}>
                        <View style={styles.subIconContainer}>
                           <Ionicons name="diamond" size={22} color="#FFD700" />
                        </View>
                        <View>
                           <Text style={[styles.subPlanName, { color: isDark ? '#FFF' : '#000' }]}>
                               FACTS+ {user.plan === 'yearly' ? 'Annuel' : user.plan === 'monthly' ? 'Mensuel' : 'Premium'}
                           </Text>
                           <Text style={styles.subStatus}>
                               Renouvellement : {formatDate(user.premiumExpiresAt as any || new Date(Date.now() + 30*24*60*60*1000))}
                           </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.neutral.gray[400]} />
                 </TouchableOpacity>
             </View>
          ) : (
             <TouchableOpacity 
              onPress={onNavigateToPaywall}
              activeOpacity={0.95}
              style={[styles.premiumBanner, { marginTop: 0 }]}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumGradient}
              >
                <View style={styles.premiumContent}>
                  <View style={styles.premiumIcon}>
                    <Ionicons name="diamond" size={24} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumTitle}>Passer à FACTS+</Text>
                    <Text style={styles.premiumSubtitle}>Plan actuel: Gratuit (5/jour)</Text>
                  </View>
                  <View style={styles.upgradeButton}>
                     <Text style={styles.upgradeButtonText}>UPGRADE</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Settings Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[500] }]}>
            PRÉFÉRENCES
          </Text>
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'phone-portrait-outline',
              'Suivre le système',
              <Switch 
                value={state.theme === 'system'} 
                onValueChange={(val) => setTheme(val ? 'system' : (isDark ? 'dark' : 'light'))}
                trackColor={{ false: Colors.neutral.gray[300], true: Colors.primary.main }}
                ios_backgroundColor={Colors.neutral.gray[300]}
              />
            )}

            {state.theme !== 'system' && renderSettingItem(
              'moon-outline', 
              'Mode Sombre', 
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.neutral.gray[300], true: Colors.primary.main }}
                ios_backgroundColor={Colors.neutral.gray[300]}
              />
            )}
            
            <View style={[styles.separator, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[200] }]} />

            {renderSettingItem(
              'notifications-outline', 
              'Notifications', 
              'Oui',
              () => Alert.alert("Bientôt disponible", "La gestion des notifications arrive bientôt !")
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? Colors.neutral.gray[400] : Colors.neutral.gray[500] }]}>
            COMPTE
          </Text>
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'person-outline', 
              'Modifier le profil', 
              '',
              handleOpenEditProfile,
            )}
            
            <View style={[styles.separator, { backgroundColor: isDark ? Colors.dark.surface : Colors.neutral.gray[200] }]} />

            {renderSettingItem(
              'shield-checkmark-outline', 
              'Confidentialité et sécurité', 
              '',
              () => Alert.alert("Bientôt disponible")
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
           <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : '#FFF0F0' }
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.semantic.error} />
            <Text style={[styles.logoutText, { color: Colors.semantic.error }]}>Se déconnecter</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: isDark ? Colors.neutral.gray[600] : Colors.neutral.gray[400] }]}>
            FACTS v1.0.0
          </Text>
        </Animated.View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsEditModalVisible(false)}
        >
            <TouchableOpacity 
                activeOpacity={1} 
                style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
            >
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>Modifier le profil</Text>
                
                <Text style={[styles.inputLabel, { color: isDark ? '#CCC' : '#666' }]}>Nom d'affichage</Text>
                <TextInput
                    style={[
                        styles.modalInput, 
                        { 
                            color: isDark ? '#FFF' : '#000',
                            backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5',
                            borderColor: isDark ? '#3A3A3C' : '#E0E0E0'
                        }
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Votre nom"
                    placeholderTextColor={isDark ? '#555' : '#AAA'}
                    autoFocus
                />

                <View style={styles.modalActions}>
                    <TouchableOpacity 
                        style={styles.modalButttonCancel} 
                        onPress={() => setIsEditModalVisible(false)}
                    >
                        <Text style={{ color: isDark ? '#AAA' : '#666' }}>Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.modalButtonSave} 
                        onPress={handleSaveProfile}
                    >
                        <Text style={{ color: '#FFF', fontWeight: '600' }}>Enregistrer</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    height: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    ...Typography.headline,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
    overflow: 'visible', // Allow badge to stick out if needed, but here we want it over
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  editBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userName: {
    ...Typography.title2,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title3,
    fontWeight: '800',
  },
  statLabel: {
    ...Typography.caption1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption1,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    ...Typography.body,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    ...Typography.subheadline,
  },
  separator: {
    height: 1,
    marginLeft: 56, // Icon width + gap + padding
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  logoutText: {
    ...Typography.headline,
    fontWeight: '600',
  },
  versionText: {
    ...Typography.caption2,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  premiumBanner: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  premiumGradient: {
    padding: Spacing.lg,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: {
    ...Typography.headline,
    fontWeight: '800', // Extra bold
    color: '#FFF',
  },
  premiumSubtitle: {
    ...Typography.caption2,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  subIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPlanName: {
    ...Typography.body,
    fontWeight: '700',
  },
  subStatus: {
    ...Typography.caption2,
    color: Colors.neutral.gray[500],
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF8C00',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modalButttonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonSave: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
});
