/**
 * FACTS - Type Definitions
 */

export type VerdictType = 
  | 'TRUE' 
  | 'FALSE' 
  | 'MISLEADING' 
  | 'NUANCED' 
  | 'AI_GENERATED'
  | 'MANIPULATED'
  | 'UNVERIFIED';

export interface Source {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
  trustScore?: number;
}

export interface VisualAnalysis {
  isAIGenerated: boolean;
  isManipulated: boolean;
  artifacts: string[];
  confidence: number;
  details: string;
}

export interface FactCheckResult {
  id: string;
  claim: string;
  verdict: VerdictType;
  confidenceScore: number;
  summary: string;
  analysis: string;
  sources: Source[];
  visualAnalysis?: VisualAnalysis;
  imageUrl?: string;
  createdAt: Date;
  processingTimeMs: number;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: Date;
  factChecksCount: number;
  isPremium: boolean;
  plan?: 'free' | 'monthly' | 'yearly';
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'none';
  premiumExpiresAt?: Date | string; // Dates often come as strings from JSON API
}

export interface HistoryItem {
  id: string;
  userId: string;
  factCheck: FactCheckResult;
  savedAt: Date;
}

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppState {
  isLoading: boolean;
  isOnboarded: boolean;
  user: User | null;
  theme: ThemeMode;
}
