/**
 * Chronicle UI Primitive Tokens
 * Minimal Design System - Monochrome + Warm Accent
 *
 * Following the 60-30-10 rule:
 * - 60% Neutral (backgrounds, text)
 * - 30% Secondary neutral (borders, muted)
 * - 10% Accent (amber - interactive elements)
 */

export const primitives = {
  // Single warm accent color (amber/orange)
  accent: {
    primary: '#F59E0B',      // Amber - main interactive color
    light: '#FBBF24',        // Lighter for hover/strings
    dark: '#D97706',         // Darker for pressed states
  },

  // Pure monochrome neutrals (no warm/cool tint)
  neutral: {
    white: '#FFFFFF',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#E5E5E5',
    gray300: '#D4D4D4',
    gray400: '#A3A3A3',
    gray500: '#737373',
    gray600: '#525252',
    gray700: '#404040',
    gray800: '#262626',
    gray900: '#171717',
    black: '#0A0A0A',
  },

  // Minimal semantic colors (muted versions)
  semantic: {
    error: '#DC2626',        // Red - errors only
    success: '#16A34A',      // Green - success only
  },

  // Transparency variants
  alpha: {
    black5: 'rgba(10, 10, 10, 0.05)',
    black10: 'rgba(10, 10, 10, 0.1)',
    black20: 'rgba(10, 10, 10, 0.2)',
    black40: 'rgba(10, 10, 10, 0.4)',
    white5: 'rgba(255, 255, 255, 0.05)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white40: 'rgba(255, 255, 255, 0.4)',
  },
} as const

export type PrimitiveTokens = typeof primitives
