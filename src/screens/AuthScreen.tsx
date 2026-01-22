/**
 * FACTS - Auth Screen
 * Premium authentication options screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface AuthScreenProps {
  onContinueWithApple: () => void;
  onContinueWithGoogle: () => void;
  onContinueWithEmail: () => void;
  onLoginWithEmail: () => void;
}

export default function AuthScreen({
  onContinueWithApple,
  onContinueWithGoogle,
  onContinueWithEmail,
  onLoginWithEmail,
}: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    callback();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDF6F4', '#F8E8E5', '#F0D9D5', '#E8CAC6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        {/* Logo */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.logoSection}>
          <View style={styles.dotsLogo}>
            <View style={[styles.logoDot, styles.logoDotLeft]} />
            <View style={[styles.logoDot, styles.logoDotRight]} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.titleSection}>
          <Text style={styles.title}>Commencez</Text>
          <Text style={styles.subtitle}>
            Créez un compte gratuitement.{'\n'}Vérifiez n'importe quelle information en quelques secondes.
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Auth Buttons */}
        <Animated.View 
          entering={FadeInDown.delay(400)} 
          style={[styles.buttonsSection, { paddingBottom: insets.bottom + 24 }]}
        >
          {/* Apple Button */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={() => handlePress(onContinueWithApple)}
              activeOpacity={0.9}
            >
              <Ionicons name="logo-apple" size={22} color="#1A1A1A" />
              <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
            </TouchableOpacity>
          )}

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => handlePress(onContinueWithGoogle)}
            activeOpacity={0.9}
          >
            <Text style={styles.googleButtonText}>Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Email Button - Signup */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => handlePress(onContinueWithEmail)}
            activeOpacity={0.8}
          >
            <Text style={styles.emailButtonText}>Créer un compte avec Email</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => handlePress(onLoginWithEmail)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            En continuant, vous acceptez nos{'\n'}
            <Text style={styles.termsLink}>Conditions d'utilisation</Text>
            {' '}et{' '}
            <Text style={styles.termsLink}>Politique de confidentialité</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dotsLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
  },
  logoDotLeft: {
    marginRight: -8,
  },
  logoDotRight: {
    marginLeft: -8,
  },
  titleSection: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(26, 26, 26, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  buttonsSection: {
    gap: 14,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  appleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  googleButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emailButton: {
    paddingVertical: 16,
  },
  emailButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  terms: {
    fontSize: 13,
    color: 'rgba(26, 26, 26, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  loginLink: {
    paddingVertical: 12,
    marginTop: 4,
  },
  loginLinkText: {
    fontSize: 15,
    color: 'rgba(26, 26, 26, 0.7)',
    textAlign: 'center',
  },
  loginLinkBold: {
    fontWeight: '600',
    color: '#1A1A1A',
    textDecorationLine: 'underline',
  },
});
