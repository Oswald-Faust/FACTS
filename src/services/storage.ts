/**
 * FACTS - Local Storage Service
 * Gestion du stockage local avec AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FactCheckResult, User, HistoryItem } from '../types';

const STORAGE_KEYS = {
  ONBOARDED: '@facts/onboarded',
  USER: '@facts/user',
  HISTORY: '@facts/history',
  THEME: '@facts/theme',
  AUTH_TOKEN: '@facts/auth_token',
};

/**
 * Sauvegarde le token d'authentification
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

/**
 * Récupère le token d'authentification
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Marque l'onboarding comme terminé
 */
export async function setOnboarded(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting onboarded:', error);
  }
}

/**
 * Vérifie si l'onboarding est terminé
 */
export async function isOnboarded(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error checking onboarded:', error);
    return false;
  }
}

/**
 * Sauvegarde l'utilisateur
 */
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

/**
 * Récupère l'utilisateur
 */
export async function getUser(): Promise<User | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Supprime l'utilisateur (logout)
 */
export async function removeUser(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing user:', error);
  }
}

/**
 * Sauvegarde un fact-check dans l'historique
 */
export async function saveFactCheck(factCheck: FactCheckResult): Promise<void> {
  try {
    const history = await getHistory();
    const historyItem: HistoryItem = {
      id: factCheck.id,
      userId: 'local',
      factCheck,
      savedAt: new Date(),
    };
    
    // Ajouter au début de l'historique
    history.unshift(historyItem);
    
    // Limiter à 100 entrées
    const limitedHistory = history.slice(0, 100);
    
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error saving fact check:', error);
  }
}

/**
 * Récupère l'historique des fact-checks
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

/**
 * Supprime un item de l'historique
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const history = await getHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Error deleting history item:', error);
  }
}

/**
 * Vide tout l'historique
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('Error clearing history:', error);
  }
}

/**
 * Sauvegarde le thème
 */
export async function saveTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

/**
 * Récupère le thème
 */
export async function getTheme(): Promise<'light' | 'dark' | 'system'> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (value as 'light' | 'dark' | 'system') || 'system';
  } catch (error) {
    console.error('Error getting theme:', error);
    return 'system';
  }
}

/**
 * Efface toutes les données
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}
