/**
 * Chronicle UI Semantic Tokens
 * Theme-dependent mappings from primitives to semantic meanings
 */

import { primitives } from './primitives'
import type { ThemeMode } from './types'

const { rainbow, neutral } = primitives

/**
 * Create semantic tokens for a given theme mode
 * Rainbow accents stay the same in both themes - that's the pop art magic!
 */
export function createSemanticTokens(mode: ThemeMode) {
  const isDark = mode === 'dark'

  return {
    // Backgrounds
    background: {
      page: isDark ? neutral.warmGray900 : neutral.cream,
      surface: isDark ? neutral.warmGray800 : neutral.white,
      elevated: isDark ? neutral.warmGray700 : neutral.warmGray50,
      sunken: isDark ? neutral.black : neutral.warmGray100,
    },

    // Text
    text: {
      primary: isDark ? neutral.cream : neutral.warmGray900,
      secondary: isDark ? neutral.warmGray400 : neutral.warmGray500,
      muted: isDark ? neutral.warmGray500 : neutral.warmGray400,
      inverse: isDark ? neutral.warmGray900 : neutral.cream,
    },

    // Borders
    border: {
      subtle: isDark ? neutral.warmGray700 : neutral.warmGray200,
      default: isDark ? neutral.warmGray600 : neutral.warmGray300,
      strong: isDark ? neutral.warmGray500 : neutral.warmGray400,
    },

    // Rainbow accents (same in both themes!)
    accent: {
      primary: rainbow.yellow, // Sunny yellow - main accent
      secondary: rainbow.magenta, // Hot magenta
      tertiary: rainbow.cyan, // Electric cyan
    },

    // Semantic colors
    semantic: {
      success: rainbow.green,
      warning: rainbow.orange,
      error: rainbow.red,
      info: rainbow.cyan,
    },

    // Signal rate colors (for visualizations)
    signal: {
      audio: rainbow.yellow, // a-rate
      control: rainbow.cyan, // k-rate
      init: neutral.warmGray400, // i-rate
      table: rainbow.orange, // function tables
    },

    // Status colors
    status: {
      working: rainbow.green,
      wip: rainbow.yellow,
      planned: neutral.warmGray400,
    },

    // Callout types
    callout: {
      info: {
        bg: isDark ? `${rainbow.cyan}15` : `${rainbow.cyan}10`,
        border: rainbow.cyan,
        icon: rainbow.cyan,
      },
      warning: {
        bg: isDark ? `${rainbow.orange}15` : `${rainbow.orange}10`,
        border: rainbow.orange,
        icon: rainbow.orange,
      },
      tip: {
        bg: isDark ? `${rainbow.green}15` : `${rainbow.green}10`,
        border: rainbow.green,
        icon: rainbow.green,
      },
    },
  } as const
}

export type SemanticTokens = ReturnType<typeof createSemanticTokens>
