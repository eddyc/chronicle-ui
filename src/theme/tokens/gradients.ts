/**
 * Chronicle UI Gradient Tokens
 * Minimal design - no rainbow gradients, only subtle accent fades
 */

import { primitives } from './primitives'

const { accent, neutral } = primitives

export const gradients = {
  // Simple accent gradient (for rare decorative use)
  accent: {
    horizontal: `linear-gradient(90deg, ${accent.dark}, ${accent.primary}, ${accent.light})`,
    vertical: `linear-gradient(180deg, ${accent.dark}, ${accent.primary})`,
  },

  // Neutral fade (for backgrounds)
  neutral: {
    horizontal: `linear-gradient(90deg, ${neutral.gray700}, ${neutral.gray600})`,
    vertical: `linear-gradient(180deg, ${neutral.gray800}, ${neutral.gray900})`,
  },

  // Transparent fades
  fade: {
    toTransparent: `linear-gradient(180deg, transparent, ${neutral.black}40)`,
    fromTransparent: `linear-gradient(180deg, ${neutral.black}40, transparent)`,
  },
} as const

export type GradientTokens = typeof gradients
