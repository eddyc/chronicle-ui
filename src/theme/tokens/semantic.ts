/**
 * Chronicle UI Semantic Tokens
 * Minimal monochrome + warm accent design
 */

import { primitives } from './primitives'
import type { ThemeMode } from './types'

const { accent, neutral, semantic: sem } = primitives

/**
 * Create semantic tokens for a given theme mode
 * Pure monochrome with single amber accent
 */
export function createSemanticTokens(mode: ThemeMode) {
  const isDark = mode === 'dark'

  return {
    // Backgrounds - pure grays
    background: {
      page: isDark ? neutral.gray900 : neutral.white,
      surface: isDark ? neutral.gray800 : neutral.gray50,
      elevated: isDark ? neutral.gray700 : neutral.gray100,
      sunken: isDark ? neutral.black : neutral.gray100,
    },

    // Text - high contrast monochrome
    text: {
      primary: isDark ? neutral.white : neutral.black,
      secondary: isDark ? neutral.gray400 : neutral.gray500,
      muted: isDark ? neutral.gray500 : neutral.gray400,
      inverse: isDark ? neutral.black : neutral.white,
    },

    // Borders - subtle grays
    border: {
      subtle: isDark ? neutral.gray700 : neutral.gray200,
      default: isDark ? neutral.gray600 : neutral.gray300,
      strong: isDark ? neutral.gray500 : neutral.gray400,
    },

    // Single accent color for all interactive elements
    // Light mode uses darker amber for better contrast
    accent: {
      primary: isDark ? accent.primary : accent.dark,
      primaryHover: isDark ? accent.light : accent.primary,
      primaryPressed: accent.dark,
      primaryMuted: isDark ? `${accent.primary}20` : `${accent.dark}15`,
      // For text on accent backgrounds
      onAccent: neutral.black,
    },

    // Minimal semantic colors - only for critical states
    semantic: {
      error: sem.error,
      success: sem.success,
      warning: accent.primary,  // Use accent for warnings
      info: neutral.gray500,    // Gray for info
    },

    // Signal visualization - all use accent or gray
    signal: {
      audio: isDark ? accent.primary : accent.dark,    // a-rate
      control: isDark ? accent.light : accent.primary, // k-rate (slightly different)
      init: neutral.gray500,    // i-rate
      table: isDark ? accent.primary : accent.dark,    // function tables
    },

    // Status - simplified to accent + gray
    status: {
      working: sem.success,
      wip: isDark ? accent.primary : accent.dark,
      planned: neutral.gray500,
    },

    // Callouts - single style (no color variants)
    callout: {
      background: isDark ? neutral.gray800 : neutral.gray100,
      border: isDark ? neutral.gray600 : neutral.gray300,
      accent: isDark ? accent.primary : accent.dark,
    },
  } as const
}

export type SemanticTokens = ReturnType<typeof createSemanticTokens>
