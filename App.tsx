/**
 * FACTS - Main App Component
 * Premium Fact-Checking Application
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as expoSplashScreen from 'expo-splash-screen';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

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
import NewsSuggestionsScreen from './src/screens/NewsSuggestionsScreen';

// Prevent native splash screen from auto-hiding
expoSplashScreen.preventAutoHideAsync();

type AppScreen = 
  | 'splash'
  | 'welcome'
  | 'auth'
  | 'emailAuth'
  | 'home'
  | 'result'
  | 'history'
  | 'profile'
  | 'paywall'
  | 'newsSuggestions';

import ApiService from './src/services/api';
import * as Storage from './src/services/storage';
import PurchaseService from './src/services/PurchaseService';

function AppContent() {
  const { state, dispatch, completeOnboarding, setUser } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'signup'>('signup');
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(false);

  // Google Auth Hook
  console.log('Google Client IDs:', {
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  });

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'facts-app',
  });

  const [request, googleResponse, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    redirectUri,
  });

  // Handle Google Auth Response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      handleGoogleAuthSuccess(authentication?.accessToken);
    }
  }, [googleResponse]);

  const handleGoogleAuthSuccess = async (accessToken?: string) => {
    if (!accessToken) return;

    try {
      // Fetch user info from Google API
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await response.json();

      if (googleUser.email) {
        const { user } = await ApiService.socialLogin({
          email: googleUser.email,
          displayName: googleUser.name,
          photoUrl: googleUser.picture,
          provider: 'google',
          providerId: googleUser.sub,
        });

        dispatch({ type: 'SET_USER', payload: user });
        await completeOnboarding();
        setCurrentScreen('home');
      }
    } catch (error) {
      console.error('Google User Info Fetch Error:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les informations Google.');
    }
  };

  // Hide native splash when app is ready and init RevenueCat
  useEffect(() => {
    PurchaseService.init();
    if (!state.isLoading) {
      expoSplashScreen.hideAsync();
    }
  }, [state.isLoading]);

  // Determine initial screen after loading AND splash animation
  useEffect(() => {
    if (!state.isLoading && isSplashAnimationDone && currentScreen === 'splash') {
      if (state.isOnboarded && state.user) {
        setCurrentScreen('home');
      } else if (state.isOnboarded) {
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [state.isLoading, isSplashAnimationDone, currentScreen, state.isOnboarded, state.user]);

  // Handle auto-redirect when user logs out or session expires
  useEffect(() => {
    if (!state.isLoading && isSplashAnimationDone) {
      const protectedScreens: AppScreen[] = ['home', 'result', 'history', 'profile', 'paywall', 'newsSuggestions'];
      
      if (!state.user && protectedScreens.includes(currentScreen)) {
        setCurrentScreen('auth');
      }
    }
  }, [state.user, state.isLoading, isSplashAnimationDone, currentScreen]);

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setIsSplashAnimationDone(true);
  };

  // Handle welcome screen complete
  const handleWelcomeComplete = () => {
    setCurrentScreen('auth');
  };

  // Handle auth options
  const handleContinueWithApple = async () => {
    try {
      // For now, we use a consistent mock identity but get a REAL token from the backend
      const { user } = await ApiService.socialLogin({
        email: 'user@apple.com',
        displayName: 'Utilisateur Apple',
        provider: 'apple',
        providerId: 'apple-mock-id-123'
      });

      dispatch({ type: 'SET_USER', payload: user });
      await completeOnboarding();
      setCurrentScreen('home');
    } catch (error) {
      console.error('Apple login failed:', error);
      // fallback in case backend is down or something
    }
  };

  const handleContinueWithGoogle = async () => {
    console.log('--- DEBUG GOOGLE AUTH ---');
    console.log('Redirect URI sent to Google:', redirectUri);
    promptAsync();
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
  const navigateToNews = () => setCurrentScreen('newsSuggestions');
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
              onNavigateToNews={navigateToNews}
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

      case 'newsSuggestions':
        return (
          <Animated.View 
            key="newsSuggestions" 
            style={StyleSheet.absoluteFill}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <NewsSuggestionsScreen
              onBack={navigateToHome}
              onSelectSuggestion={navigateToHome}
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
