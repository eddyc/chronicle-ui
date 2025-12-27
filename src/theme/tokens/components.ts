/**
 * Chronicle UI Component Tokens
 * Specific values for individual components
 */

import { primitives } from './primitives'
import type { SemanticTokens } from './semantic'
import type { ThemeMode } from './types'

const { rainbow } = primitives

/**
 * Create component-specific tokens from semantic tokens
 */
export function createComponentTokens(semantic: SemanticTokens, _mode: ThemeMode) {
  return {
    knob: {
      background: semantic.background.elevated,
      indicator: semantic.accent.primary,
      track: semantic.border.subtle,
      value: {
        background: semantic.background.sunken,
        text: semantic.accent.primary,
        glow: `${semantic.accent.primary}60`,
      },
    },

    codeBlock: {
      background: semantic.background.sunken,
      border: semantic.border.subtle,
      header: semantic.background.surface,
      // Rainbow syntax highlighting
      syntax: {
        keyword: rainbow.magenta,
        string: rainbow.green,
        function: rainbow.yellow,
        number: rainbow.orange,
        comment: semantic.text.muted,
        punctuation: semantic.text.secondary,
        property: rainbow.cyan,
        className: rainbow.purple,
        boolean: rainbow.orange,
        operator: semantic.text.secondary,
      },
    },

    playButton: {
      background: semantic.background.elevated,
      border: semantic.border.default,
      activeBackground: rainbow.red,
      iconPlay: semantic.accent.primary,
      iconStop: semantic.text.primary,
    },

    waveform: {
      background: semantic.background.sunken,
      grid: semantic.border.subtle,
      centerLine: semantic.border.default,
      stroke: semantic.accent.primary,
      glow: `${semantic.accent.primary}60`,
    },

    meter: {
      background: semantic.background.sunken,
      fill: semantic.accent.primary,
      track: semantic.border.subtle,
      tickMark: semantic.border.default,
    },

    sidebar: {
      background: semantic.background.surface,
      border: semantic.border.subtle,
      itemHover: semantic.background.elevated,
      itemSelected: `${semantic.accent.primary}20`,
      textSelected: semantic.accent.primary,
    },

    card: {
      background: semantic.background.surface,
      border: semantic.border.subtle,
    },

    liveDemo: {
      background: semantic.background.surface,
      border: `${semantic.accent.tertiary}30`,
      headerBackground: `${semantic.accent.tertiary}10`,
      headerText: semantic.accent.tertiary,
    },
  } as const
}

export type ComponentTokens = ReturnType<typeof createComponentTokens>
