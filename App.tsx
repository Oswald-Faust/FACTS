/**
 * FACTS - Main App Component
 * Premium Fact-Checking Application
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as SplashScreenExpo from 'expo-splash-screen';

import { AppProvider, useApp } from './src/contexts/AppContext';
import { User } from './src/types';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import EmailAuthScreen from './src/screens/EmailAuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PaywallScreen from './src/screens/PaywallScreen';

// Prevent native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

type AppScreen = 
  | 'splash'
  | 'welcome'
  | 'auth'
  | 'emailAuth'
  | 'home'
  | 'result'
  | 'history'
  | 'profile'
  | 'paywall';

function AppContent() {
  const { state, dispatch, completeOnboarding } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'signup'>('signup');

  // Hide native splash when app is ready
  useEffect(() => {
    if (!state.isLoading) {
      SplashScreenExpo.hideAsync();
    }
  }, [state.isLoading]);

  // Determine initial screen after loading
  useEffect(() => {
    if (!state.isLoading && currentScreen === 'splash') {
      // If splash animation hasn't started yet, keep it
      // The SplashScreen component will call onFinish when done
    }
  }, [state.isLoading]);

  // Handle splash screen finish
  const handleSplashFinish = () => {
    if (state.isOnboarded && state.user) {
      setCurrentScreen('home');
    } else if (state.isOnboarded) {
      setCurrentScreen('auth');
    } else {
      setCurrentScreen('welcome');
    }
  };

  // Handle welcome screen complete
  const handleWelcomeComplete = () => {
    setCurrentScreen('auth');
  };

  // Handle auth options
  const handleContinueWithApple = async () => {
    // TODO: Implement Apple Sign In
    // For now, simulate success
    const mockUser = { 
      id: 'apple-user-' + Date.now(),
      email: 'user@apple.com',
      name: 'Apple User',
      createdAt: new Date(),
      factChecksCount: 0,
      isPremium: false,
    };
    dispatch({ type: 'SET_USER', payload: mockUser });
    await completeOnboarding();
    setCurrentScreen('home');
  };

  const handleContinueWithGoogle = async () => {
    // TODO: Implement Google Sign In
    // For now, simulate success
    const mockUser = { 
      id: 'google-user-' + Date.now(),
      email: 'user@gmail.com',
      name: 'Google User',
      createdAt: new Date(),
      factChecksCount: 0,
      isPremium: false,
    };
    dispatch({ type: 'SET_USER', payload: mockUser });
    await completeOnboarding();
    setCurrentScreen('home');
  };

  const handleContinueWithEmail = () => {
    setEmailAuthMode('signup');
    setCurrentScreen('emailAuth');
  };

  const handleLoginWithEmail = () => {
    setEmailAuthMode('login');
    setCurrentScreen('emailAuth');
  };

  // Handle email auth
  const handleEmailAuthBack = () => {
    setCurrentScreen('auth');
  };

  const handleEmailAuthSuccess = async (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
    await completeOnboarding();
    setCurrentScreen('home');
  };

  // Navigation handlers
  const navigateToResult = () => setCurrentScreen('result');
  const navigateToHistory = () => setCurrentScreen('history');
  const navigateToProfile = () => setCurrentScreen('profile');
  const navigateToHome = () => setCurrentScreen('home');
  const navigateToPaywall = () => setCurrentScreen('paywall');

  // Render based on current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return (
          <Animated.View 
            key="splash" 
            style={StyleSheet.absoluteFill}
            exiting={FadeOut.duration(300)}
          >
            <SplashScreen onFinish={handleSplashFinish} />
          </Animated.View>
        );

      case 'welcome':
        return (
          <Animated.View 
            key="welcome" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <WelcomeScreen onComplete={handleWelcomeComplete} />
          </Animated.View>
        );

      case 'auth':
        return (
          <Animated.View 
            key="auth" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <AuthScreen
              onContinueWithApple={handleContinueWithApple}
              onContinueWithGoogle={handleContinueWithGoogle}
              onContinueWithEmail={handleContinueWithEmail}
              onLoginWithEmail={handleLoginWithEmail}
            />
          </Animated.View>
        );

      case 'emailAuth':
        return (
          <Animated.View 
            key="emailAuth" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <EmailAuthScreen
              onBack={handleEmailAuthBack}
              onSuccess={handleEmailAuthSuccess}
              initialMode={emailAuthMode}
            />
          </Animated.View>
        );
      case 'home':
        return (
          <Animated.View 
            key="home" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <HomeScreen
              onNavigateToResult={navigateToResult}
              onNavigateToHistory={navigateToHistory}
              onNavigateToProfile={navigateToProfile}
              onNavigateToPaywall={navigateToPaywall}
            />
          </Animated.View>
        );

      case 'result':
        return (
          <Animated.View 
            key="result" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <ResultScreen
              onBack={navigateToHome}
              onNewCheck={navigateToHome}
            />
          </Animated.View>
        );

      case 'history':
        return (
          <Animated.View 
            key="history" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <HistoryScreen
              onBack={navigateToHome}
              onSelectItem={(item) => {
                dispatch({ type: 'SET_CURRENT_FACT_CHECK', payload: item.factCheck });
                navigateToResult();
              }}
            />
          </Animated.View>
        );

      case 'profile':
        return (
          <Animated.View 
            key="profile" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <ProfileScreen
              onBack={navigateToHome}
              onNavigateToPaywall={navigateToPaywall}
            />
          </Animated.View>
        );

      case 'paywall':
        return (
          <Animated.View 
            key="paywall" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <PaywallScreen
              onClose={() => setCurrentScreen('home')}
              onRestore={() => {
                // TODO: Implement restore logic
                console.log('Restore purchases');
              }}
            />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBE8E7',
  },
});
