/**
 * FACTS - Email Auth Screen
 * Email and password authentication form
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import GradientButton from '../components/GradientButton';
import ApiService from '../services/api';
import { User } from '../types';

type AuthMode = 'email' | 'password' | 'signup';
type InitialAuthMode = 'login' | 'signup';

interface EmailAuthScreenProps {
  onBack: () => void;
  onSuccess: (user: User) => void;
  initialMode?: InitialAuthMode;
}

export default function EmailAuthScreen({ onBack, onSuccess, initialMode = 'signup' }: EmailAuthScreenProps) {
  const insets = useSafeAreaInsets();
  const isLoginFlow = initialMode === 'login';
  const [mode, setMode] = useState<AuthMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  const inputScale = useSharedValue(1);

  const handleFocus = () => {
    inputScale.value = withSpring(1.02, { damping: 15 });
  };

  const handleBlur = () => {
    inputScale.value = withSpring(1, { damping: 15 });
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'email') {
      if (!validateEmail(email)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
        return;
      }
      // Check if user exists (can be done via API to check email availability, skipping for now)
      // Moving to password prompt (assuming login first, user can switch to signup)
      // Check if user exists (can be done via API to check email availability, skipping for now)
      // Moving to password prompt based on initial mode
      if (initialMode === 'signup') {
         setMode('signup');
      } else {
         setMode('password');
      }
      return;
    }

    if (mode === 'password' || mode === 'signup') {
      if (password.length < 6) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Mot de passe invalide', 'Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }

      if (mode === 'signup' && !name.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Nom requis', 'Veuillez entrer votre nom.');
        return;
      }

      setIsLoading(true);

      try {
        let response;
        if (mode === 'signup') {
          response = await ApiService.register(email, password, name);
        } else {
          response = await ApiService.login(email, password);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(response.user);
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de l\'authentification.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === 'email') {
      onBack();
    } else {
      setMode('email');
      setPassword('');
      setName('');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'email':
        return 'Quelle est votre adresse email ?';
      case 'password':
        return 'Entrez votre mot de passe';
      case 'signup':
        return 'Créez votre compte';
      default:
        return '';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'email':
        return "Entrez votre adresse email pour continuer.";
      case 'password':
        return `Connectez-vous à ${email}`;
      case 'signup':
        return 'Quelques informations pour créer votre compte.';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FBE8E7', '#F5D0CE', '#E8B4B8', '#D4A5A5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.titleSection}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.formSection}>
            {mode === 'signup' && (
              <Animated.View style={inputAnimatedStyle}>
                <TextInput
                  ref={nameInputRef}
                  style={styles.input}
                  placeholder="Votre nom"
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={name}
                  onChangeText={setName}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </Animated.View>
            )}

            {mode === 'email' && (
              <Animated.View style={inputAnimatedStyle}>
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </Animated.View>
            )}

            {(mode === 'password' || mode === 'signup') && (
              <Animated.View style={[inputAnimatedStyle, styles.passwordContainer]}>
                <TextInput
                  ref={passwordInputRef}
                  style={styles.passwordInput}
                  placeholder="Mot de passe"
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={mode === 'password'}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="rgba(26, 26, 26, 0.5)"
                  />
                </TouchableOpacity>
              </Animated.View>
            )}

            {mode === 'password' && (
              <TouchableOpacity 
                style={styles.switchModeButton}
                onPress={() => setMode('signup')}
              >
                <Text style={styles.switchModeText}>
                  Nouveau compte ? <Text style={styles.switchModeLink}>Créer un compte</Text>
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'signup' && (
              <TouchableOpacity 
                style={styles.switchModeButton}
                onPress={() => setMode('password')}
              >
                <Text style={styles.switchModeText}>
                  Déjà un compte ? <Text style={styles.switchModeLink}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Continue Button */}
          <Animated.View 
            entering={FadeInDown.delay(300)} 
            style={[styles.buttonSection, { paddingBottom: insets.bottom + 20 }]}
          >
            <GradientButton
              title={isLoading ? '' : 'Continuer'}
              onPress={handleContinue}
              gradient={['#1A1A1A', '#2A2A2A']}
              loading={isLoading}
              disabled={isLoading || (mode === 'email' && !email) || ((mode === 'password' || mode === 'signup') && !password)}
              style={styles.continueButton}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  titleSection: {
    gap: 12,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(26, 26, 26, 0.6)',
    lineHeight: 22,
  },
  formSection: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.1)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26, 26, 26, 0.1)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 16,
  },
  switchModeButton: {
    paddingVertical: 8,
  },
  switchModeText: {
    ...Typography.subheadline,
    color: 'rgba(26, 26, 26, 0.6)',
    textAlign: 'center',
  },
  switchModeLink: {
    color: '#1A1A1A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
  buttonSection: {
    paddingTop: Spacing.lg,
  },
  continueButton: {
    width: '100%',
  },
});
