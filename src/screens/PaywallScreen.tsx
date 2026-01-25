/**
 * FACTS - Paywall Screen
 * Premium subscription sales page
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientButton from '../components/GradientButton';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface PaywallScreenProps {
  onClose: () => void;
  onRestore: () => void;
}

const FEATURES = [
  {
    icon: 'infinite',
    title: 'Vérifications Illimitées',
    description: 'Ne vous posez plus de questions, vérifiez tout.',
  },
  {
    icon: 'scan-circle',
    title: 'Analyse Visuelle IA',
    description: 'Détectez les deepfakes et contextes d\'images.',
  },
  {
    icon: 'search',
    title: 'Deep Search',
    description: 'Recherche croisée dans les bases académiques.',
  },
  {
    icon: 'flash',
    title: 'Réponses Prioritaires',
    description: 'Passez devant tout le monde, zéro attente.',
  },
];

import ApiService from '../services/api';
import { useApp } from '../contexts/AppContext';

export default function PaywallScreen({ onClose, onRestore }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useApp();

  // Pricing (Placeholder for RevenueCat)
  const priceYearly = '49,99 €';
  const priceMonthly = '9,99 €';
  const savings = 'Économisez 58%';

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
       // Simulate Purchase Delay
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       // Call Backend to upgrade
       const user = await ApiService.upgradeToPremium();
       setUser(user);
       
       Alert.alert("Félicitations!", "Bienvenue dans le club FACTS+. Profitez de la vérité sans limites.");
       onClose();
    } catch (error) {
       Alert.alert("Erreur", "L'achat a échoué. Veuillez réessayer.");
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#1A1A1E', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Background Abstract Glows */}
      <View style={[styles.glow, { top: -100, right: -100, backgroundColor: '#FFD700', opacity: 0.15 }]} />
      <View style={[styles.glow, { bottom: -100, left: -100, backgroundColor: '#FF4500', opacity: 0.1 }]} />

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRestore}>
            <Text style={styles.restoreText}>Restaurer</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.logoBadge}
            >
              <Text style={styles.logoText}>PRO</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>Devenez un{'\n'}Expert de la Vérité</Text>
          <Text style={styles.subtitle}>
            Accédez à la puissance maximale de l'IA pour ne plus jamais être dupé.
          </Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <Animated.View 
              key={feature.title} 
              entering={FadeInDown.delay(200 + index * 50)} 
              style={styles.featureItem}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color="#FFD700" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Plans */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.plansContainer}>
          {/* Yearly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedPlan]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.9}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioButton}>
                {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
              </View>
              <View>
                <Text style={styles.planTitle}>Annuel</Text>
                <Text style={styles.planSavings}>{savings}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={styles.planPrice}>{priceYearly}</Text>
               <Text style={styles.planPeriod}>/ an</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlan]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.9}
          >
            <View style={styles.planHeader}>
               <View style={styles.radioButton}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.planTitle}>Mensuel</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={styles.planPrice}>{priceMonthly}</Text>
               <Text style={styles.planPeriod}>/ mois</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.disclaimer}>
          Abonnement renouvelable automatiquement. Annulable à tout moment.
          (Simulation: Aucun débit ne sera effectué)
        </Text>

      </ScrollView>



      {/* Floating CTA */}
      <Animated.View entering={SlideInUp.delay(600)} style={[styles.ctaContainer, { paddingBottom: insets.bottom + 20 }]}>
         <GradientButton
            title={isLoading ? "Traitement..." : `Commencer (${selectedPlan === 'yearly' ? priceYearly : priceMonthly})`}
            onPress={handlePurchase}
            gradient={['#FFD700', '#FF8C00']} // Gold Gradient
            textStyle={{ color: '#000', fontWeight: '800' }}
            style={styles.ctaButton}
            disabled={isLoading}
         />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: 'blur(80px)', // Web specific, might need workaround for native if not using BlurView
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 14,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontWeight: '900',
    color: '#000',
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800', // Bold but not Black
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  featuresContainer: {
    gap: 20,
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
  },
  plansContainer: {
    gap: 12,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  selectedPlan: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  planTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  planSavings: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  planPrice: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
  planPeriod: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 80,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.9)', // Slight fade
  },
  ctaButton: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  }
});
