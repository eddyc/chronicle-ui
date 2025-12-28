/**
 * Chronicle UI Component Tokens
 * Minimal design - amber accent + monochrome
 */

import { primitives } from './primitives'
import type { SemanticTokens } from './semantic'
import type { ThemeMode } from './types'

const { accent, neutral } = primitives

/**
 * Create component-specific tokens from semantic tokens
 */
export function createComponentTokens(semantic: SemanticTokens, mode: ThemeMode) {
  const isDark = mode === 'dark'

  return {
    knob: {
      background: semantic.background.elevated,
      indicator: semantic.accent.primary,
      track: semantic.border.subtle,
    },

    codeBlock: {
      background: semantic.background.sunken,
      border: semantic.border.subtle,
      header: semantic.background.surface,
      // Minimal 4-5 color syntax highlighting
      syntax: {
        // 1. Functions/DSL - accent color
        function: semantic.accent.primary,
        // 2. Strings/values - lighter accent (use hover which is mode-aware)
        string: semantic.accent.primaryHover,
        // 3. Keywords - muted gray
        keyword: semantic.text.muted,
        // 4. Comments - very muted
        comment: isDark ? neutral.gray600 : neutral.gray400,
        // 5. Everything else - inherit
        punctuation: semantic.text.secondary,
        operator: semantic.text.secondary,
      },
    },

    playButton: {
      background: semantic.background.elevated,
      border: semantic.border.default,
      activeBackground: semantic.accent.primary,
      activeText: semantic.accent.onAccent,
      icon: semantic.text.primary,
    },

    waveform: {
      background: semantic.background.sunken,
      grid: semantic.border.subtle,
      centerLine: semantic.border.default,
      stroke: semantic.accent.primary,
      fill: semantic.accent.primaryMuted,
    },

    meter: {
      background: semantic.background.elevated,
      fill: semantic.accent.primary,
      track: semantic.border.subtle,
    },

    sidebar: {
      background: semantic.background.surface,
      border: semantic.border.subtle,
      itemHover: semantic.background.elevated,
      itemSelected: semantic.accent.primaryMuted,
      textSelected: semantic.accent.primary,
    },

    card: {
      background: semantic.background.surface,
      border: semantic.border.subtle,
    },

    liveDemo: {
      background: semantic.background.surface,
      border: semantic.border.subtle,
      headerBackground: semantic.background.elevated,
      headerText: semantic.accent.primary,
    },

    // Border radius tokens
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      pill: 9999,
    },
  } as const
}

export type ComponentTokens = ReturnType<typeof createComponentTokens>
