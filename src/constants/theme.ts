/**
 * FACTS - Premium iOS Theme System
 * Design Philosophy: Apple-level minimalism with Glassmorphism
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: "#007AFF",
    light: "#5AC8FA",
    dark: "#0051A8",
    gradient: ["#007AFF", "#5856D6"],
  },

  // Verdict Colors
  verdict: {
    true: "#34C759",
    false: "#FF3B30",
    misleading: "#FF9500",
    nuanced: "#5856D6",
    aiGenerated: "#AF52DE",
    unverified: "#8E8E93",
  },

  // Semantic Colors
  semantic: {
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    info: "#5AC8FA",
  },

  // Neutral Palette
  neutral: {
    white: "#FFFFFF",
    black: "#000000",
    gray: {
      50: "#F9FAFB",
      100: "#F2F2F7",
      200: "#E5E5EA",
      300: "#D1D1D6",
      400: "#C7C7CC",
      500: "#AEAEB2",
      600: "#8E8E93",
      700: "#636366",
      800: "#48484A",
      900: "#3A3A3C",
      950: "#1C1C1E",
    },
  },

  // Dark Mode Backgrounds
  dark: {
    background: "#000000",
    elevated: "#1C1C1E",
    card: "#2C2C2E",
    surface: "#3A3A3C",
  },

  // Light Mode Backgrounds
  light: {
    background: "#F2F2F7",
    elevated: "#FFFFFF",
    card: "#FFFFFF",
    surface: "#F9FAFB",
  },

  // Glassmorphism
  glass: {
    light: "rgba(255, 255, 255, 0.72)",
    dark: "rgba(28, 28, 30, 0.72)",
    border: "rgba(255, 255, 255, 0.18)",
  },
};

export const Typography = {
  // SF Pro Display - Headers
  largeTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },

  // SF Pro Text - Body
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  body: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  callout: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subheadline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 11,
    fontWeight: "400" as const,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 22.5, // iOS Standard
  full: 9999,
  card: 16,
  button: 14,
  input: 12,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  }),
};

export const Animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  spring: {
    gentle: { damping: 20, stiffness: 150 },
    bouncy: { damping: 12, stiffness: 180 },
    stiff: { damping: 26, stiffness: 300 },
  },
};

export const Layout = {
  screenPadding: 20,
  cardPadding: 16,
  contentMaxWidth: 600,
  headerHeight: 56,
  tabBarHeight: 83,
  bottomSafeArea: 34,
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  Layout,
};
